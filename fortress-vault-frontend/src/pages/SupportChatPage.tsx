import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSendSupportMessage, useSupportMessages, useSupportThread } from '@/hooks/useSupportChat';

export default function SupportChatPage() {
  const { data: thread } = useSupportThread();
  const { data, refetch } = useSupportMessages();
  const sendMessage = useSendSupportMessage();
  const [draft, setDraft] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const messages = useMemo(() => data?.messages ?? [], [data?.messages]);

  useEffect(() => {
    if (!data?.thread_id) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:9000/ws/chat/${data.thread_id}/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = () => {
      refetch();
    };

    wsRef.current = ws;
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [data?.thread_id, refetch]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Support Chat</span>
              <Badge variant={thread?.status === 'open' ? 'default' : 'secondary'}>{thread?.status || 'open'}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Chat directly with admin about shipment and delivery issues.</p>
          </CardHeader>
          <CardContent>
            <div className="h-[420px] overflow-y-auto border rounded-md p-3 space-y-3 mb-4 bg-muted/20">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.sender_role === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                      <p className="text-xs opacity-80 mb-1">{m.sender_name}</p>
                      <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your message..." />
              <Button
                disabled={sendMessage.isPending || !draft.trim()}
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
    </Layout>
  );
}
