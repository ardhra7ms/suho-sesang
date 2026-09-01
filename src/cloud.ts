const configuredClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
const storedClientId = (() => {
  try {
    return localStorage.getItem('suho-sesang-google-client-id')?.trim()
  } catch {
    return undefined
  }
})()
let googleClientId = configuredClientId || storedClientId
const driveScope =
  'openid email https://www.googleapis.com/auth/drive.appdata'
const driveApi = 'https://www.googleapis.com/drive/v3'
const driveUploadApi = 'https://www.googleapis.com/upload/drive/v3'
const worldFileName = 'state-v1.bin'
const keyInfoFileName = 'key-info-v1.json'
const assetPrefix = 'asset-'
const assetSuffix = '.bin'

export const cloudConfigured = Boolean(googleClientId)

export function configureGoogleClientId(value: string): void {
  const clientId = value.trim()
  if (
    clientId.length < 30 ||
    !clientId.endsWith('.apps.googleusercontent.com')
  ) {
    throw new Error('Paste a valid Google Web OAuth client ID.')
  }
  localStorage.setItem('suho-sesang-google-client-id', clientId)
  googleClientId = clientId
}

export type SyncStatus =
  | 'local'
  | 'connecting'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error'

export type Session = {
  user: {
    id: string
    email?: string
  }
}

export type SyncedElement = {
  id: string
  name: string
  blob: Blob
  createdAt: string
}

type GoogleTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void
}

type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string
        scope: string
        callback: (response: GoogleTokenResponse) => void
        error_callback?: (error: { message?: string }) => void
      }) => GoogleTokenClient
      revoke: (token: string, callback: () => void) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

type DriveFile = {
  id: string
  name: string
  createdTime?: string
  modifiedTime?: string
}

let accessToken = ''
let encryptionKey: CryptoKey | null = null
let activeSession: Session | null = null
let lastSavedWorldJson = ''
let worldSaveQueue = Promise.resolve()

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google) return window.google
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-google-identity]',
  )
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not load.')), {
        once: true,
      })
    })
  } else {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      script.addEventListener('load', () => resolve(), { once: true })
      script.addEventListener(
        'error',
        () => reject(new Error('Google sign-in could not load.')),
        { once: true },
      )
      document.head.append(script)
    })
  }
  if (!window.google) throw new Error('Google sign-in is unavailable.')
  return window.google
}

async function requestAccessToken(prompt = 'consent'): Promise<string> {
  if (!googleClientId) throw new Error('Google Drive sync is not configured.')
  const google = await loadGoogleIdentity()
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: driveScope,
      callback: (response) => {
        if (response.access_token) resolve(response.access_token)
        else {
          reject(
            new Error(
              response.error_description ??
                response.error ??
                'Google authorization failed.',
            ),
          )
        }
      },
      error_callback: (error) =>
        reject(new Error(error.message ?? 'Google authorization failed.')),
    })
    client.requestAccessToken({ prompt })
  })
}

async function googleFetch(
  input: string,
  init: RequestInit = {},
  allowTokenRefresh = true,
): Promise<Response> {
  if (!accessToken) throw new Error('Connect Google Drive first.')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(input, { ...init, headers })
  if (response.status === 401 && allowTokenRefresh) {
    accessToken = await requestAccessToken('')
    return googleFetch(input, init, false)
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Google Drive request failed (${response.status}).`)
  }
  return response
}

async function listDriveFiles(query?: string): Promise<DriveFile[]> {
  const files: DriveFile[] = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'nextPageToken,files(id,name,createdTime,modifiedTime)',
      orderBy: 'createdTime',
      pageSize: '1000',
    })
    if (query) params.set('q', query)
    if (pageToken) params.set('pageToken', pageToken)
    const response = await googleFetch(`${driveApi}/files?${params}`)
    const result = (await response.json()) as {
      files?: DriveFile[]
      nextPageToken?: string
    }
    files.push(...(result.files ?? []))
    pageToken = result.nextPageToken ?? ''
  } while (pageToken)
  return files
}

async function findDriveFiles(name: string): Promise<DriveFile[]> {
  const escapedName = name.replaceAll("'", "\\'")
  return listDriveFiles(
    `name = '${escapedName}' and trashed = false`,
  )
}

async function findDriveFile(name: string): Promise<DriveFile | null> {
  return (await findDriveFiles(name))[0] ?? null
}

async function readDriveFile(fileId: string): Promise<Blob> {
  const response = await googleFetch(
    `${driveApi}/files/${encodeURIComponent(fileId)}?alt=media`,
  )
  return response.blob()
}

async function createDriveFile(name: string): Promise<DriveFile> {
  const response = await googleFetch(`${driveApi}/files?fields=id,name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parents: ['appDataFolder'] }),
  })
  return response.json() as Promise<DriveFile>
}

async function writeDriveFile(name: string, body: Blob): Promise<void> {
  const existing = await findDriveFiles(name)
  const file = existing[0] ?? (await createDriveFile(name))
  await Promise.all(
    existing.slice(1).map((duplicate) => deleteDriveFile(duplicate.id)),
  )
  await googleFetch(
    `${driveUploadApi}/files/${encodeURIComponent(file.id)}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/octet-stream' },
      body,
    },
  )
}

async function deleteDriveFile(fileId: string): Promise<void> {
  await googleFetch(`${driveApi}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  })
}

async function deriveEncryptionKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 600_000,
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function loadOrCreateEncryptionKey(passphrase: string) {
  let salt: Uint8Array<ArrayBuffer>
  const keyInfoFiles = await findDriveFiles(keyInfoFileName)
  const keyInfo = keyInfoFiles[0]
  if (keyInfo) {
    const value = JSON.parse(await (await readDriveFile(keyInfo.id)).text()) as {
      salt?: string
      check?: string
    }
    if (!value.salt || !value.check) {
      throw new Error('The cloud encryption metadata is invalid.')
    }
    salt = base64ToBytes(value.salt)
    encryptionKey = await deriveEncryptionKey(passphrase, salt)
    const check = await decryptBlob(
      new Blob([base64ToBytes(value.check)], {
        type: 'application/octet-stream',
      }),
    )
    if ((await check.text()) !== 'suho-sesang-encryption-check-v1') {
      throw new Error('The encryption passphrase is incorrect.')
    }
    await Promise.all(
      keyInfoFiles.slice(1).map((duplicate) => deleteDriveFile(duplicate.id)),
    )
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16))
    encryptionKey = await deriveEncryptionKey(passphrase, salt)
    const check = await encryptBlob(
      new Blob(['suho-sesang-encryption-check-v1'], { type: 'text/plain' }),
    )
    await writeDriveFile(
      keyInfoFileName,
      new Blob(
        [
          JSON.stringify({
            version: 1,
            salt: bytesToBase64(salt),
            check: bytesToBase64(
              new Uint8Array(await check.arrayBuffer()),
            ),
          }),
        ],
        { type: 'application/json' },
      ),
    )
  }
}

async function encryptBlob(value: Blob): Promise<Blob> {
  if (!encryptionKey) throw new Error('Enter the encryption passphrase first.')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    await value.arrayBuffer(),
  )
  return new Blob([new TextEncoder().encode('SSG1'), iv, encrypted], {
    type: 'application/octet-stream',
  })
}

async function decryptBlob(value: Blob): Promise<Blob> {
  if (!encryptionKey) throw new Error('Enter the encryption passphrase first.')
  const bytes = new Uint8Array(await value.arrayBuffer())
  const marker = new TextDecoder().decode(bytes.slice(0, 4))
  if (marker !== 'SSG1') throw new Error('This cloud file is not a Suho backup.')
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(4, 16) },
      encryptionKey,
      bytes.slice(16),
    )
    return new Blob([decrypted])
  } catch {
    throw new Error('The encryption passphrase is incorrect.')
  }
}

export async function connectGoogleDrive(
  passphrase: string,
): Promise<Session> {
  if (passphrase.length < 10) {
    throw new Error('Use an encryption passphrase with at least 10 characters.')
  }
  accessToken = await requestAccessToken()
  const response = await googleFetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
  )
  const profile = (await response.json()) as { sub: string; email?: string }
  await loadOrCreateEncryptionKey(passphrase)
  activeSession = { user: { id: profile.sub, email: profile.email } }
  return activeSession
}

export async function getCloudSession(): Promise<Session | null> {
  return activeSession
}

export function watchCloudSession(
  _onSession: (session: Session | null) => void,
) {
  return () => {}
}

export async function signOutCloud(): Promise<void> {
  const token = accessToken
  accessToken = ''
  encryptionKey = null
  activeSession = null
  if (!token || !window.google) return
  await new Promise<void>((resolve) => {
    window.google!.accounts.oauth2.revoke(token, resolve)
  })
}

export async function loadCloudWorld(
  _userId: string,
): Promise<unknown | null> {
  const file = await findDriveFile(worldFileName)
  if (!file) return null
  const decrypted = await decryptBlob(await readDriveFile(file.id))
  return JSON.parse(await decrypted.text()) as unknown
}

export async function saveCloudWorld(
  _userId: string,
  world: unknown,
): Promise<void> {
  const worldJson = JSON.stringify(world)
  const save = worldSaveQueue
    .catch(() => undefined)
    .then(async () => {
      if (worldJson === lastSavedWorldJson) return
      const encrypted = await encryptBlob(
        new Blob([worldJson], { type: 'application/json' }),
      )
      await writeDriveFile(worldFileName, encrypted)
      lastSavedWorldJson = worldJson
    })
  worldSaveQueue = save
  await save
}

export function watchCloudWorld(
  _userId: string,
  onWorld: (world: unknown) => void,
  onError: () => void,
) {
  let lastModified = ''
  const poll = async () => {
    const file = await findDriveFile(worldFileName)
    const modified = file?.modifiedTime ?? ''
    if (file && lastModified && modified !== lastModified) {
      const decrypted = await decryptBlob(await readDriveFile(file.id))
      onWorld(JSON.parse(await decrypted.text()) as unknown)
    }
    lastModified = modified
  }
  void poll().catch(onError)
  const interval = window.setInterval(() => void poll().catch(onError), 20_000)
  return () => window.clearInterval(interval)
}

function assetFileName(elementId: string): string {
  return `${assetPrefix}${elementId}${assetSuffix}`
}

async function encodeElement(element: SyncedElement): Promise<Blob> {
  const marker = new TextEncoder().encode('SSE2')
  const header = new TextEncoder().encode(
    JSON.stringify({
      version: 2,
      id: element.id,
      name: element.name,
      createdAt: element.createdAt,
      type: element.blob.type,
    }),
  )
  const headerLength = new Uint8Array(4)
  new DataView(headerLength.buffer).setUint32(0, header.length)
  return encryptBlob(
    new Blob([marker, headerLength, header, element.blob], {
      type: 'application/octet-stream',
    }),
  )
}

async function decodeElement(file: DriveFile): Promise<SyncedElement> {
  const decrypted = await decryptBlob(await readDriveFile(file.id))
  const bytes = new Uint8Array(await decrypted.arrayBuffer())
  if (new TextDecoder().decode(bytes.slice(0, 4)) === 'SSE2') {
    const headerLength = new DataView(
      bytes.buffer,
      bytes.byteOffset + 4,
      4,
    ).getUint32(0)
    const dataOffset = 8 + headerLength
    if (headerLength === 0 || dataOffset > bytes.length) {
      throw new Error('This synced element is invalid.')
    }
    const value = JSON.parse(
      new TextDecoder().decode(bytes.slice(8, dataOffset)),
    ) as {
      id: string
      name: string
      createdAt: string
      type: string
    }
    return {
      id: value.id,
      name: value.name,
      createdAt: value.createdAt,
      blob: new Blob([bytes.slice(dataOffset)], { type: value.type }),
    }
  }

  const value = JSON.parse(await decrypted.text()) as {
    id: string
    name: string
    createdAt: string
    type: string
    data: string
  }
  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    blob: new Blob([base64ToBytes(value.data)], { type: value.type }),
  }
}

export async function deleteCloudElement(
  _userId: string,
  elementId: string,
): Promise<void> {
  const files = await findDriveFiles(assetFileName(elementId))
  await Promise.all(files.map((file) => deleteDriveFile(file.id)))
}

export async function syncCloudElements(
  _userId: string,
  localElements: SyncedElement[],
  deletedElementIds: string[],
): Promise<SyncedElement[]> {
  const deletedIds = new Set(deletedElementIds)
  const remoteFiles = await listDriveFiles(
    `name contains '${assetPrefix}' and trashed = false`,
  )
  const remoteById = new Map<string, DriveFile>()
  const duplicateFiles: DriveFile[] = []
  remoteFiles
    .filter(
      (file) =>
        file.name.startsWith(assetPrefix) && file.name.endsWith(assetSuffix),
    )
    .forEach((file) => {
      const id = file.name.slice(assetPrefix.length, -assetSuffix.length)
      if (remoteById.has(id)) duplicateFiles.push(file)
      else remoteById.set(id, file)
    })
  await Promise.all(duplicateFiles.map((file) => deleteDriveFile(file.id)))
  const localById = new Map(
    localElements
      .filter((element) => !deletedIds.has(element.id))
      .map((element) => [element.id, element]),
  )

  for (const id of deletedIds) {
    const remote = remoteById.get(id)
    if (remote) await deleteDriveFile(remote.id)
  }
  for (const element of localById.values()) {
    if (!remoteById.has(element.id)) {
      await writeDriveFile(assetFileName(element.id), await encodeElement(element))
    }
  }
  for (const [id, remote] of remoteById) {
    if (!deletedIds.has(id) && !localById.has(id)) {
      localById.set(id, await decodeElement(remote))
    }
  }
  return [...localById.values()]
}

export function watchCloudElements(
  _userId: string,
  onChange: () => void,
  onError: () => void,
) {
  let signature = ''
  const poll = async () => {
    const files = await listDriveFiles(
      `name contains '${assetPrefix}' and trashed = false`,
    )
    const nextSignature = files
      .map((file) => `${file.id}:${file.modifiedTime}`)
      .sort()
      .join('|')
    if (signature && nextSignature !== signature) onChange()
    signature = nextSignature
  }
  void poll().catch(onError)
  const interval = window.setInterval(() => void poll().catch(onError), 20_000)
  return () => window.clearInterval(interval)
}
