import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface SupportThread {
  id: string;
  status: 'open' | 'closed';
  subject: string;
  updated_at: string;
  unread_count: number;
}

export interface SupportMessage {
  id: string;
  sender_email: string;
  sender_name: string;
  sender_role: 'admin' | 'customer';
  body: string;
  created_at: string;
  is_read: boolean;
}

export const useSupportThread = () =>
  useQuery<SupportThread>({
    queryKey: ['support-thread'],
    queryFn: async () => (await api.get('/users/chat/my_thread/')).data,
  });

export const useSupportMessages = () =>
  useQuery<{ thread_id: string; messages: SupportMessage[] }>({
    queryKey: ['support-messages'],
    queryFn: async () => {
      const data = (await api.get('/users/chat/messages/')).data;
      return {
        thread_id: data.thread_id,
        messages: Array.isArray(data.messages) ? data.messages : [],
      };
    },
    refetchInterval: 15000,
  });

export const useSendSupportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => (await api.post('/users/chat/send/', { body })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to send message');
    },
  });
};
