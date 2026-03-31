import { useQuery } from '@tanstack/react-query'
import api from './api'

export function usePublicWebsiteSettings() {
  return useQuery({
    queryKey: ['public-website-settings'],
    queryFn: () => api.get('/public/website').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
