import { createClient, type Session } from '@supabase/supabase-js'

export type { Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim()

export const cloudConfigured = Boolean(supabaseUrl && supabaseKey)
export const supabase = cloudConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export type SyncStatus =
  | 'local'
  | 'connecting'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error'

export type SyncedElement = {
  id: string
  name: string
  blob: Blob
  createdAt: string
}

type CloudElementRow = {
  id: string
  name: string
  storage_path: string
  created_at: string
}

function requireSupabase() {
  if (!supabase) throw new Error('Cloud sync is not configured.')
  return supabase
}

export async function getCloudSession(): Promise<Session | null> {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export function watchCloudSession(
  onSession: (session: Session | null) => void,
) {
  const client = requireSupabase()
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => onSession(session))
  return () => subscription.unsubscribe()
}

export async function sendMagicLink(email: string): Promise<void> {
  const client = requireSupabase()
  const redirectUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl.toString() },
  })
  if (error) throw error
}

export async function signOutCloud(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}

export async function loadCloudWorld(userId: string): Promise<unknown | null> {
  const { data, error } = await requireSupabase()
    .from('user_worlds')
    .select('world')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.world ?? null
}

export async function saveCloudWorld(
  userId: string,
  world: unknown,
): Promise<void> {
  const { error } = await requireSupabase().from('user_worlds').upsert({
    user_id: userId,
    world,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export function watchCloudWorld(
  userId: string,
  onWorld: (world: unknown) => void,
) {
  const client = requireSupabase()
  const channel = client
    .channel(`world:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_worlds',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const updated = payload.new as { world?: unknown }
        if (updated.world) onWorld(updated.world)
      },
    )
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}

async function uploadCloudElement(
  userId: string,
  element: SyncedElement,
): Promise<void> {
  const client = requireSupabase()
  const path = `${userId}/${element.id}`
  const { error: storageError } = await client.storage
    .from('user-elements')
    .upload(path, element.blob, {
      contentType: element.blob.type || 'application/octet-stream',
      upsert: true,
    })
  if (storageError) throw storageError

  const { error: rowError } = await client.from('user_elements').upsert({
    id: element.id,
    user_id: userId,
    name: element.name,
    storage_path: path,
    created_at: element.createdAt,
  })
  if (rowError) throw rowError
}

export async function deleteCloudElement(
  userId: string,
  elementId: string,
): Promise<void> {
  const client = requireSupabase()
  const path = `${userId}/${elementId}`
  const { error: storageError } = await client.storage
    .from('user-elements')
    .remove([path])
  if (storageError) throw storageError
  const { error: rowError } = await client
    .from('user_elements')
    .delete()
    .eq('user_id', userId)
    .eq('id', elementId)
  if (rowError) throw rowError
}

export async function syncCloudElements(
  userId: string,
  localElements: SyncedElement[],
  deletedElementIds: string[],
): Promise<SyncedElement[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('user_elements')
    .select('id, name, storage_path, created_at')
    .eq('user_id', userId)
  if (error) throw error

  const deletedIds = new Set(deletedElementIds)
  const remoteRows = (data ?? []) as CloudElementRow[]
  const localById = new Map(
    localElements
      .filter((element) => !deletedIds.has(element.id))
      .map((element) => [element.id, element]),
  )

  for (const row of remoteRows) {
    if (deletedIds.has(row.id)) {
      await deleteCloudElement(userId, row.id)
    }
  }

  const activeRemoteRows = remoteRows.filter((row) => !deletedIds.has(row.id))
  const remoteIds = new Set(activeRemoteRows.map((row) => row.id))
  for (const element of localById.values()) {
    if (!remoteIds.has(element.id)) {
      await uploadCloudElement(userId, element)
    }
  }

  for (const row of activeRemoteRows) {
    if (localById.has(row.id)) continue
    const { data: blob, error: downloadError } = await client.storage
      .from('user-elements')
      .download(row.storage_path)
    if (downloadError) throw downloadError
    localById.set(row.id, {
      id: row.id,
      name: row.name,
      blob,
      createdAt: row.created_at,
    })
  }

  return [...localById.values()]
}

export function watchCloudElements(userId: string, onChange: () => void) {
  const client = requireSupabase()
  const channel = client
    .channel(`elements:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_elements',
        filter: `user_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}
