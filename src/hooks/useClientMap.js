import { useQuery } from '@tanstack/react-query'

async function fetchClientMap(slug) {
  const res = await fetch(`/api/map/${slug}`)
  if (res.status === 404) throw Object.assign(new Error('not_found'), { status: 404 })
  if (res.status === 403) throw Object.assign(new Error('inactive'), { status: 403 })
  if (!res.ok) throw new Error('server_error')
  return res.json()
}

export function useClientMap(slug) {
  const query = useQuery({
    queryKey: ['client-map', slug],
    queryFn: () => fetchClientMap(slug),
    retry: false,
    enabled: !!slug,
  })

  const status = query.error?.status
  return {
    map:         query.data,
    pois:        query.data?.pois ?? [],
    itineraries: query.data?.itineraries ?? [],
    loading:     query.isLoading,
    is404:       status === 404,
    is403:       status === 403,
    error:       query.isError,
  }
}
