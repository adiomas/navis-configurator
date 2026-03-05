import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { InviteUserFormData, UpdateUserFormData } from '@/lib/validators'

export function useUsers() {
  return useQuery<Profile[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InviteUserFormData): Promise<{ user: { id: string; email: string; full_name: string; role: string } }> => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(data),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite user')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateUserFormData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          role: data.role,
        })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ user_id: userId, new_password: newPassword }),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }
      return result
    },
  })
}

export function useToggleUserActive(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
