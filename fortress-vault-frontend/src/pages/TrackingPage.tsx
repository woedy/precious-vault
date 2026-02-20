import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Clock, Loader2, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompleteShipmentStageAction, useShipments, type ShipmentWorkflowStage } from '@/hooks/useShipments';

const stageBadgeVariant = (stage: ShipmentWorkflowStage): 'default' | 'secondary' | 'destructive' => {
  if (stage.is_blocked) return 'destructive';
  if (stage.status === 'completed') return 'default';
  return 'secondary';
};

export default function TrackingPage() {
  const navigate = useNavigate();
  const { data: deliveries, isLoading } = useShipments();
  const completeStageAction = useCompleteShipmentStageAction();
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground italic">Fetching shipment updates...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shipment Tracking</h1>
          <p className="text-muted-foreground">Monitor each delivery stage and resolve required actions.</p>
        </div>

        {!deliveries || deliveries.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Active Shipments</h3>
            <p className="text-muted-foreground mb-6">You have no assets currently in transit.</p>
            <Button onClick={() => navigate('/vaults')}>View Vault Holdings</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveries.map((delivery) => {
              const activeStage = delivery.workflow_stages?.find((stage) => stage.status === 'in_progress');

              return (
                <Card key={delivery.id} className="overflow-hidden">
                  <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                    <div>
                      <span className="font-mono text-sm text-muted-foreground mr-2">
                        #{delivery.tracking_number || 'PENDING'}
                      </span>
                      <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                        {delivery.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      Est. Arrival:{' '}
                      {delivery.estimated_delivery ? new Date(delivery.estimated_delivery).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {!!activeStage && (
                      <div className="rounded-lg border p-4 bg-muted/20">
                        <p className="text-sm font-semibold mb-2">Active Stage</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={stageBadgeVariant(activeStage)}>{activeStage.name}</Badge>
                          {activeStage.requires_customer_action && !activeStage.customer_action_completed && (
                            <Badge variant="secondary">Customer Action Required</Badge>
                          )}
                          {activeStage.is_blocked && (
                            <Badge variant="destructive">Blocked by Admin</Badge>
                          )}
                        </div>

                        {activeStage.is_blocked && (
                          <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {activeStage.blocked_reason || 'This stage is currently blocked by admin.'}
                          </p>
                        )}

                        {activeStage.requires_customer_action && !activeStage.customer_action_completed && !activeStage.is_blocked && (
                          <div className="mt-3 flex flex-col md:flex-row gap-2">
                            <Input
                              value={notes[delivery.id] || ''}
                              onChange={(e) => setNotes((prev) => ({ ...prev, [delivery.id]: e.target.value }))}
                              placeholder="Describe how you resolved this stage (e.g. paperwork submitted)"
                            />
                            <Button
                              disabled={completeStageAction.isPending || !(notes[delivery.id] || '').trim()}
                              onClick={() =>
                                completeStageAction.mutate({
                                  shipmentId: delivery.id,
                                  action_note: (notes[delivery.id] || '').trim(),
                                })
                              }
                            >
                              Submit Resolution
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-base">Workflow Stages</CardTitle>
                      </CardHeader>
                      <div className="space-y-3">
                        {delivery.workflow_stages?.map((stage) => (
                          <div key={stage.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-sm">{stage.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{stage.status.replace('_', ' ')}</p>
                              {stage.customer_action_completed && stage.customer_action_note && (
                                <p className="text-xs mt-1 text-emerald-700">Customer note: {stage.customer_action_note}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {stage.requires_customer_action && <Clock className="h-4 w-4 text-muted-foreground" />}
                              {stage.is_blocked && <AlertTriangle className="h-4 w-4 text-destructive" />}
                              {stage.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                              <Badge variant={stageBadgeVariant(stage)}>{stage.is_blocked ? 'Blocked' : stage.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
