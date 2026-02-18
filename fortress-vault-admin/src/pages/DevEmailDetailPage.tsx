import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DevEmailDetail {
  id: string;
  subject: string;
  from_email: string;
  recipient_list: string[];
  text_content: string;
  html_content: string;
  template_name: string;
  context: Record<string, unknown>;
  status: string;
  error: string;
  created_at: string;
}

const DevEmailDetailPage: React.FC = () => {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dev-email', id],
    queryFn: async () => {
      const response = await api.get<DevEmailDetail>(`/dev-emails/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  const email = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Detail</h2>
          <p className="text-muted-foreground">Captured email details and HTML preview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/dev-emails">Back to Inbox</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : isError || !email ? (
            <div className="text-sm text-destructive">Failed to load email.</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Subject:</span> {email.subject}</div>
              <div><span className="font-medium">From:</span> {email.from_email || '(empty)'}</div>
              <div><span className="font-medium">To:</span> {(email.recipient_list || []).join(', ') || '(none)'}</div>
              <div><span className="font-medium">Status:</span> {email.status}</div>
              <div><span className="font-medium">Created:</span> {new Date(email.created_at).toLocaleString()}</div>
              {email.template_name ? (
                <div><span className="font-medium">Template:</span> {email.template_name}</div>
              ) : null}
              {email.error ? (
                <div className="text-destructive"><span className="font-medium">Error:</span> {email.error}</div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HTML Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {email?.html_content ? (
            <iframe
              title="email-preview"
              className="w-full rounded-md border bg-white"
              style={{ height: 600 }}
              sandbox="allow-forms allow-popups allow-top-navigation-by-user-activation"
              srcDoc={email.html_content}
            />
          ) : (
            <div className="text-sm text-muted-foreground">No HTML content.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plain Text</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm rounded-md border p-4 bg-accent/30">
            {email?.text_content || ''}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Context (JSON)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-xs rounded-md border p-4 bg-accent/30 overflow-auto">
            {email ? JSON.stringify(email.context ?? {}, null, 2) : ''}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevEmailDetailPage;
