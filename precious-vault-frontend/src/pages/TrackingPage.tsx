import { Layout } from '@/components/layout/Layout';
import { useMockApp } from '@/context/MockAppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Package, Map, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrackingPage() {
    const navigate = useNavigate();
    const { deliveries } = useMockApp();

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Shipment Tracking</h1>
                    <p className="text-muted-foreground">Monitor the status of your physical deliveries.</p>
                </div>

                {deliveries.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-xl">
                        <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Active Shipments</h3>
                        <p className="text-muted-foreground mb-6">You have no assets currently in transit.</p>
                        <Button onClick={() => navigate('/vaults')}>View Vault Holdings</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {deliveries.map(delivery => (
                            <Card key={delivery.id} className="overflow-hidden">
                                <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                                    <div>
                                        <span className="font-mono text-sm text-muted-foreground mr-2">#{delivery.trackingNumber}</span>
                                        <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                                            {delivery.status}
                                        </Badge>
                                    </div>
                                    <span className="text-sm font-medium">Est. Arrival: {delivery.estimatedArrival}</span>
                                </div>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3">
                                        {/* Map Area (Mock) */}
                                        <div className="md:col-span-2 bg-slate-100 min-h-[300px] relative p-6 flex items-center justify-center">
                                            <div className="absolute inset-0 opacity-10"
                                                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                                            {/* Route Mock Visualization */}
                                            <div className="relative w-full max-w-md h-2 bg-slate-300 rounded-full overflow-hidden">
                                                <div className="absolute top-0 left-0 h-full bg-primary w-1/3 animate-pulse" />
                                            </div>
                                            <div className="absolute flex justify-between w-full max-w-md -mt-3 px-4">
                                                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                                                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                                                <div className="w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white" />
                                            </div>
                                            <div className="absolute flex justify-between w-full max-w-md mt-6 px-0 text-xs font-bold text-slate-600">
                                                <span>ZURICH</span>
                                                <span>TRANSIT</span>
                                                <span>{delivery.destination.city.toUpperCase()}</span>
                                            </div>
                                        </div>

                                        {/* Status Timeline */}
                                        <div className="p-6 border-l bg-card">
                                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> Latest Updates
                                            </h3>
                                            <div className="space-y-6 relative pl-2">
                                                <div className="absolute top-2 bottom-2 left-[5px] w-[1px] bg-border" />

                                                {delivery.history.map((event, i) => (
                                                    <div key={i} className="relative pl-6">
                                                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
                                                        <p className="text-sm font-medium">{event.description}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
