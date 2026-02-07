import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTrading } from '@/hooks/useTrading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ShieldCheck, MapPin, Package, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type DeliveryStep = 'select' | 'address' | 'carrier' | 'review' | 'success';

interface DeliveryConfig {
    selectedItemIds: string[];
    address: {
        street: string;
        city: string;
        zipCode: string;
        country: string;
    };
    carrier: 'fedex' | 'brinks';
}

export default function DeliveryWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: dashboard, isLoading: isLoadingDashboard } = useDashboardData();
    const { requestDelivery } = useTrading();

    const [step, setStep] = useState<DeliveryStep>('select');
    const [config, setConfig] = useState<DeliveryConfig>({
        selectedItemIds: [],
        address: {
            street: '',
            city: '',
            zipCode: '',
            country: ''
        },
        carrier: 'fedex'
    });

    // Initialize address when user data is available
    useEffect(() => {
        if (user?.address && !config.address.street) {
            setConfig(prev => ({
                ...prev,
                address: {
                    street: user.address.street,
                    city: user.address.city,
                    zipCode: user.address.zipCode,
                    country: user.address.country
                }
            }));
        }
    }, [user]);

    const portfolio = dashboard?.portfolio_items || [];
    // Filter only vaulted items
    const vaultedItems = portfolio.filter(item => item.status === 'vaulted');

    const handleToggleItem = (id: string) => {
        setConfig(prev => ({
            ...prev,
            selectedItemIds: prev.selectedItemIds.includes(id)
                ? prev.selectedItemIds.filter(i => i !== id)
                : [...prev.selectedItemIds, id]
        }));
    };

    const selectedItems = portfolio.filter(p => config.selectedItemIds.includes(p.id));
    const totalValue = selectedItems.reduce((acc, item) => acc + (Number(item.weight_oz) * (item.metal.current_price || 2500)), 0);

    const costs = {
        handling: selectedItems.length * 50,
        shipping: config.carrier === 'brinks' ? 500 : 150,
        insurance: totalValue * 0.01
    };
    const grandTotal = costs.handling + costs.shipping + costs.insurance;

    const handleSubmit = async () => {
        try {
            await requestDelivery.mutateAsync({
                items: selectedItems.map(i => ({
                    portfolio_item_id: i.id,
                    quantity: i.quantity
                })),
                carrier: config.carrier,
                destination: config.address
            });
            setStep('success');
        } catch (error) {
            // Error managed by mutation toast
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Steps Header */}
            <div className="flex justify-between mb-8 max-w-2xl mx-auto">
                {['Select Assets', 'Destination', 'Logistics', 'Review'].map((s, i) => {
                    const idx = ['select', 'address', 'carrier', 'review', 'success'].indexOf(step);
                    return (
                        <div key={s} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold 
                 ${idx >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {i + 1}
                            </div>
                            <span className="text-xs text-muted-foreground">{s}</span>
                        </div>
                    );
                })}
            </div>

            <Card>
                <CardContent className="p-6">
                    {/* STEP 1: SELECT ASSETS */}
                    {step === 'select' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Select Assets for Withdrawal</h2>
                            <p className="text-muted-foreground mb-6">Choose which vaulted items you wish to take delivery of.</p>

                            {isLoadingDashboard ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse">
                                    <Loader2 className="w-8 h-8 mb-4 animate-spin" />
                                    <span>Loading vaulted assets...</span>
                                </div>
                            ) : vaultedItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No assets currently in vault.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {vaultedItems.map(item => (
                                        <div key={item.id}
                                            onClick={() => handleToggleItem(item.id)}
                                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all
                      ${config.selectedItemIds.includes(item.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                          ${config.selectedItemIds.includes(item.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                                    {config.selectedItemIds.includes(item.id) && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold capitalize">{item.metal.name} {item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.weight_oz} oz • {item.vault_location?.city || 'Vault'}</p>
                                                </div>
                                            </div>
                                            <div className="font-mono font-medium">
                                                ${(Number(item.weight_oz) * (item.metal.current_price || 0)).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end mt-8">
                                <Button
                                    disabled={config.selectedItemIds.length === 0}
                                    onClick={() => setStep('address')}
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ADDRESS */}
                    {step === 'address' && (
                        <div className="max-w-xl mx-auto">
                            <h2 className="text-2xl font-bold mb-4">Verification & Destination</h2>
                            <div className="bg-orange-500/10 text-orange-600 p-4 rounded-lg mb-6 flex gap-3 items-start">
                                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">For security, we can initially only ship to your KYC verified address. Address changes require 48h re-verification.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Street Address</Label>
                                    <Input value={config.address.street} readOnly className="bg-muted" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>City</Label>
                                        <Input value={config.address.city} readOnly className="bg-muted" />
                                    </div>
                                    <div>
                                        <Label>Zip Code</Label>
                                        <Input value={config.address.zipCode} readOnly className="bg-muted" />
                                    </div>
                                </div>
                                <div>
                                    <Label>Country</Label>
                                    <Input value={config.address.country} readOnly className="bg-muted" />
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep('select')}>Back</Button>
                                <Button onClick={() => setStep('carrier')}>Confirm Destination</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: CARRIER */}
                    {step === 'carrier' && (
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Select Logistics Provider</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div
                                    onClick={() => setConfig({ ...config, carrier: 'fedex' })}
                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${config.carrier === 'fedex' ? 'border-primary ring-1 ring-primary' : ''}`}
                                >
                                    <Truck className="w-8 h-8 mb-4 text-orange-600" />
                                    <h3 className="font-bold text-lg">Standard Insured</h3>
                                    <p className="text-sm text-muted-foreground mb-4">FedEx / UPS High Value</p>
                                    <ul className="text-xs space-y-2 text-muted-foreground">
                                        <li className="flex gap-2">✓ Fully Insured</li>
                                        <li className="flex gap-2">✓ Signature Required</li>
                                        <li className="flex gap-2">✓ 3-5 Business Days</li>
                                    </ul>
                                    <p className="mt-4 font-bold">$150.00</p>
                                </div>

                                <div
                                    onClick={() => setConfig({ ...config, carrier: 'brinks' })}
                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${config.carrier === 'brinks' ? 'border-primary ring-1 ring-primary' : ''}`}
                                >
                                    <ShieldCheck className="w-8 h-8 mb-4 text-blue-600" />
                                    <h3 className="font-bold text-lg">Armored Transport</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Brinks / Malca-Amit</p>
                                    <ul className="text-xs space-y-2 text-muted-foreground">
                                        <li className="flex gap-2">✓ Armed Convoy</li>
                                        <li className="flex gap-2">✓ Liability Transfer at Vault</li>
                                        <li className="flex gap-2">✓ 7-10 Days</li>
                                    </ul>
                                    <p className="mt-4 font-bold">$500.00</p>
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep('address')}>Back</Button>
                                <Button onClick={() => setStep('review')}>Review Details</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 'review' && (
                        <div className="max-w-xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Review & Pay</h2>

                            <div className="bg-muted/30 p-6 rounded-xl space-y-4 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span>Assets Value ({selectedItems.length} items)</span>
                                    <span className="font-mono">${totalValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Handling & Barring Fees</span>
                                    <span className="font-mono">${costs.handling.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Logistics ({config.carrier === 'brinks' ? 'Armored' : 'Standard'})</span>
                                    <span className="font-mono">${costs.shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Transit Insurance (1%)</span>
                                    <span className="font-mono">${costs.insurance.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-4">
                                    <span>Total Details</span>
                                    <span className="text-primary">${grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep('carrier')}>Back</Button>
                                <Button onClick={handleSubmit} variant="gold" size="lg">Confirm & Pay</Button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {step === 'success' && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="h-10 w-10 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Delivery Requested</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                Your assets are being prepared for dispatch. You will receive a tracking number shortly.
                            </p>
                            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
