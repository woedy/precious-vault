import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminSendMessage, useAdminThreadMessages, useAdminThreads } from '@/hooks/useAdminChat';

const getWsBaseUrl = () => {
  const configured = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}/ws`;
};


const ChatManagementPage = () => {
  const { data: threads = [] } = useAdminThreads();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId],
  );
  const { data: messageData, refetch } = useAdminThreadMessages(selectedThreadId);
  const sendMessage = useAdminSendMessage(selectedThreadId);

  useEffect(() => {
    if (!selectedThreadId) return;
    const token = localStorage.getItem('admin_access_token');
    if (!token) return;

    const wsUrl = `${getWsBaseUrl()}/chat/${selectedThreadId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = () => refetch();
    wsRef.current = ws;
    return () => ws.close();
  }, [selectedThreadId, refetch]);

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[72vh] overflow-y-auto">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`w-full text-left border rounded-md p-3 ${selectedThreadId === thread.id ? 'border-primary bg-primary/5' : ''}`}
            >
              <p className="font-medium text-sm">{thread.customer_name}</p>
              <p className="text-xs text-muted-foreground">{thread.customer_email}</p>
              <div className="flex gap-2 mt-2 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${thread.status === 'open' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>{thread.status}</span>
                {thread.unread_count > 0 && <span className="text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-300">{thread.unread_count} unread</span>}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedThread ? `Chat with ${selectedThread.customer_name}` : 'Select a conversation'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[56vh] overflow-y-auto border rounded-md p-3 space-y-3 mb-4 bg-muted/20">
            {(messageData?.messages ?? []).map((message) => (
              <div key={message.id} className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${message.sender_role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                  <p className="text-xs opacity-80 mb-1">{message.sender_name}</p>
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to customer..." disabled={!selectedThreadId} />
            <Button
              disabled={!selectedThreadId || !draft.trim() || sendMessage.isPending}
              onClick={async () => {
                await sendMessage.mutateAsync(draft.trim());
                setDraft('');
              }}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatManagementPage;
