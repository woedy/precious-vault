
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface UserSettingsUpdate {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    preferred_vault?: string;
}

export const useSettings = () => {
    const queryClient = useQueryClient();

    const updateProfile = useMutation({
        mutationFn: async (data: UserSettingsUpdate) => {
            const response = await api.patch('/users/profile/update_me/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['user-me'] }); // Ensure auth context can refresh if needed
            // Actually, we should probably refetch the profile in AuthContext
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        }
    });

    const toggle2FA = useMutation({
        mutationFn: async (enabled: boolean) => {
            const response = await api.post('/users/profile/enable_2fa/', { enabled });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['user-me'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update 2FA');
        }
    });

    return {
        updateProfile,
        toggle2FA,
    };
};
