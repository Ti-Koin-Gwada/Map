import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdmin } from './useAdmin.js'

export function usePois() {
  const { authFetch } = useAdmin()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-pois'],
    queryFn:  async () => {
      const res = await authFetch('/api/admin/poi')
      if (!res.ok) throw new Error('fetch_failed')
      return res.json()
    },
  })

  const create = useMutation({
    mutationFn: async (data) => {
      const res = await authFetch('/api/admin/poi', { method: 'POST', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('create_failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pois'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await authFetch(`/api/admin/poi/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('update_failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pois'] }),
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const res = await authFetch(`/api/admin/poi/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete_failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pois'] }),
  })

  return {
    pois:    query.data ?? [],
    loading: query.isLoading,
    error:   query.isError,
    create,
    update,
    remove,
  }
}
