import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DevEmailListItem {
  id: string;
  created_at: string;
  status: string;
  subject: string;
  from_email: string;
  recipient_list: string[];
  recipient_count: number;
  template_name: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const DevEmailInboxPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const queryKey = useMemo(() => ['dev-emails', { search, page }], [search, page]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<DevEmailListItem>>('/dev-emails/', {
        params: {
          q: search || undefined,
          page,
        },
      });
      return response.data;
    },
  });

  const results = data?.results ?? [];
  const count = data?.count ?? 0;
  const pageSize = results.length || 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dev Email Inbox</h2>
          <p className="text-muted-foreground">
            Captured emails when SMTP is disabled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search subject, from, recipient..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : isError ? (
            <div className="text-sm text-destructive">Failed to load emails.</div>
          ) : results.length === 0 ? (
            <div className="text-sm text-muted-foreground">No captured emails.</div>
          ) : (
            <div className="space-y-3">
              {results.map((email) => (
                <Link
                  key={email.id}
                  to={`/dev-emails/${email.id}`}
                  className="block rounded-md border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{email.subject}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        From: {email.from_email || '(empty)'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        To: {(email.recipient_list || []).join(', ') || '(none)'}
                      </div>
                      {email.template_name ? (
                        <div className="text-xs text-muted-foreground truncate">
                          Template: {email.template_name}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">{new Date(email.created_at).toLocaleString()}</div>
                      <div className="text-xs">Status: {email.status}</div>
                      <div className="text-xs text-muted-foreground">Recipients: {email.recipient_count}</div>
                    </div>
                  </div>
                </Link>
              ))}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DevEmailInboxPage;
