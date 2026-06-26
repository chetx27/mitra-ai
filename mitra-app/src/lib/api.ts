const BASE = import.meta.env.VITE_API_URL as string

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function ingestProfile(profileId: string) {
  return post('/ingest/profile', { profile_id: profileId })
}

export async function ingestFile(profileId: string, fileUrl: string, sourceType: string) {
  return post('/ingest/file', { profile_id: profileId, file_url: fileUrl, source_type: sourceType })
}

export async function generateDailyReport(profileId: string, date: string) {
  return post('/report/daily', { profile_id: profileId, date })
}
