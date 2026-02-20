import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AdminChatThread {
  id: string;
  customer_email: string;
  customer_name: string;
  status: 'open' | 'closed';
  updated_at: string;
  unread_count: number;
  subject: string;
}

export interface AdminChatMessage {
  id: string;
  sender_name: string;
  sender_role: 'admin' | 'customer';
  body: string;
  created_at: string;
}

export const useAdminThreads = () =>
  useQuery<AdminChatThread[]>({
    queryKey: ['admin-chat-threads'],
    queryFn: async () => {
      const data = (await api.get('/chats/')).data;
      return Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    },
    refetchInterval: 5000,
  });

export const useAdminThreadMessages = (threadId: string | null) =>
  useQuery<{ thread_id: string; messages: AdminChatMessage[] }>({
    queryKey: ['admin-chat-messages', threadId],
    queryFn: async () => {
      const data = (await api.get(`/chats/${threadId}/messages/`)).data;
      return { thread_id: data.thread_id, messages: Array.isArray(data.messages) ? data.messages : [] };
    },
    enabled: !!threadId,
    refetchInterval: 5000,
  });

export const useAdminSendMessage = (threadId: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => api.post(`/chats/${threadId}/send/`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-chat-messages', threadId] });
      qc.invalidateQueries({ queryKey: ['admin-chat-threads'] });
    },
  });
};
