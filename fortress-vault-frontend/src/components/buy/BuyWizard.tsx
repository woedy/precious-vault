import { useState, useEffect } from 'react';
import { useTrading } from '@/hooks/useTrading';
import { useMetals } from '@/hooks/useDashboardData';
import { useVaults } from '@/hooks/useVaults';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Truck, Building2, ShieldCheck, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMetalPrices } from '@/hooks/useMetalPrices';

type BuyingStep = 'product' | 'config' | 'delivery' | 'review' | 'success';

interface OrderState {
    productId: string;
    quantity: number;
    deliveryMethod: 'vault' | 'delivery'; // Updated to match backend enum if needed, kept 'delivery' for shipping
    vaultLocationId?: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

interface Product {
    id: string;
    name: string;
    metal: { id: string; symbol: string; name: string; current_price: number; image_url?: string | null };
    weight_oz: number;
    premium_per_oz: number;
    image_url: string | null;
    manufacturer: string;
    purity: string;
}

export default function BuyWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { buy } = useTrading();
    const { data: metals } = useMetals();
    const { data: metalPrices } = useMetalPrices();

    // Fetch Products
    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get<Product[] | PaginatedResponse<Product>>('/trading/products/');
            const data = res.data;
            if (Array.isArray(data)) {
                return data;
            }
            return data.results;
        }
    });

    const { data: platformSettings } = useQuery<{ metals_buying_enabled: boolean }>({
        queryKey: ['platform', 'settings'],
        queryFn: async () => {
            const res = await api.get('/trading/platform/settings/');
            return res.data;
        },
        staleTime: 15000,
    });

    const { data: vaults } = useVaults();

    const [step, setStep] = useState<BuyingStep>('product');
    const [order, setOrder] = useState<OrderState>({
        productId: '',
        quantity: 1,
        deliveryMethod: 'vault',
        vaultLocationId: ''
    });
    const [error, setError] = useState<string | null>(null);

    // Reset error when step changes
    useEffect(() => {
        setError(null);
    }, [step]);

    // Calculate live pricing
    const selectedProduct = Array.isArray(products) ? products.find(p => p.id === order.productId) : undefined;
    const liveSpotPrice = metalPrices?.metals?.find((m) => m.id === selectedProduct?.metal.id)?.price_usd_per_oz;
    const spotPrice = Number(liveSpotPrice ?? selectedProduct?.metal.current_price ?? 0);

    const weight = Number(selectedProduct?.weight_oz || 0);
    const premium = Number(selectedProduct?.premium_per_oz || 0);

    const costs = {
        spotTotal: spotPrice * weight * order.quantity,
        premiumTotal: premium * weight * order.quantity,
        shipping: order.deliveryMethod === 'delivery' ? 45.00 : 0,
        vaultFee: 0,
        tax: order.deliveryMethod === 'delivery' ? 0 : 0
    };

    if (order.deliveryMethod === 'delivery') {
        costs.tax = (costs.spotTotal + costs.premiumTotal) * 0.08;
    }

    const grandTotal = costs.spotTotal + costs.premiumTotal + costs.shipping + costs.tax;

    const handleProductSelect = (id: string) => {
        setOrder({ ...order, productId: id });
        setStep('config');
    };

    const handleConfigSubmit = () => {
        setStep('delivery');
    };

    const handleDeliverySubmit = () => {
        setStep('review');
    };

    const handleConfirm = async () => {
        try {
            if (platformSettings && platformSettings.metals_buying_enabled === false) {
                setError('Purchasing is temporarily unavailable. Please contact an administrator.');
                return;
            }
            await buy.mutateAsync({
                product_id: order.productId,
                quantity: order.quantity,
                delivery_method: order.deliveryMethod,
                vault_id: order.deliveryMethod === 'vault' ? order.vaultLocationId : undefined
            });
            setStep('success');
        } catch (err: any) {
            console.error("Purchase failed", err);
            setError(err.response?.data?.error || "An unexpected error occurred during purchase.");
        }
    };

    if (isLoadingProducts) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step Indicator */}
            <div className="flex justify-between mb-8 max-w-2xl mx-auto md:min-w-[500px]">
                {['Select', 'Configure', 'Delivery', 'Review'].map((s, i) => {
                    const currentIdx = ['product', 'config', 'delivery', 'review', 'success'].indexOf(step);
                    const isCompleted = currentIdx > i;
                    const isActive = currentIdx === i;

                    return (
                        <div key={s} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                ${isCompleted || isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                                {i + 1}
                            </div>
                            <span className={`text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
                        </div>
                    );
                })}
            </div>

            <Card className="min-h-[500px]">
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <Info className="h-4 w-4" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* STEP 1: PRODUCT SELECTION */}
                    {step === 'product' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Select Investment Product</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.isArray(products) && products.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductSelect(product.id)}
                                        className="border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-muted/50 transition-all group"
                                    >
                                        <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center p-4 shadow-sm group-hover:shadow-md overflow-hidden">
                                            {product.metal.image_url ? (
                                                <img src={product.metal.image_url} alt={`${product.metal.name} icon`} className="h-24 w-24 object-cover rounded-full" loading="lazy" />
                                            ) : (
                                                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${product.metal.symbol === 'Au' ? 'from-yellow-200 to-amber-500' : 'from-slate-200 to-slate-400'}`} />
                                            )}
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                                <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
                                            </div>
                                            <span className="bg-secondary/10 text-secondary-foreground text-xs px-2 py-1 rounded">
                                                {product.purity}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Premium/oz</p>
                                                <p className="font-medium">${Number(product.premium_per_oz).toFixed(2)}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">Select</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONFIGURATION */}
                    {step === 'config' && selectedProduct && (
                        <div className="max-w-xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Configure Order</h2>

                            <div className="flex gap-6 mb-8 items-center bg-muted/30 p-4 rounded-xl">
                                {selectedProduct.metal.image_url ? (
                                    <img src={selectedProduct.metal.image_url} alt={`${selectedProduct.metal.name} icon`} className="w-16 h-16 rounded-full object-cover" loading="lazy" />
                                ) : (
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedProduct.metal.symbol === 'Au' ? 'from-yellow-200 to-amber-500' : 'from-slate-200 to-slate-400'}`} />
                                )}
                                <div>
                                    <h3 className="font-bold text-xl">{selectedProduct.name}</h3>
                                    <p className="text-muted-foreground">{selectedProduct.manufacturer} • {selectedProduct.weight_oz}oz</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setOrder(o => ({ ...o, quantity: Math.max(1, o.quantity - 1) }))}
                                        >
                                            -
                                        </Button>
                                        <Input
                                            type="number"
                                            className="text-center text-lg w-24"
                                            value={order.quantity}
                                            onChange={e => setOrder({ ...order, quantity: parseInt(e.target.value) || 1 })}
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setOrder(o => ({ ...o, quantity: o.quantity + 1 }))}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
                                    <span>Estimated Total</span>
                                    <span className="text-2xl font-bold text-primary">
                                        ${(grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep('product')}>Back</Button>
                                <Button onClick={handleConfigSubmit}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DELIVERY METHOD */}
                    {step === 'delivery' && (
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Delivery & Storage</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div
                                    onClick={() => setOrder({ ...order, deliveryMethod: 'vault' })}
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:bg-muted/50 ${order.deliveryMethod === 'vault' ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                                >
                                    <Building2 className={`w-8 h-8 mb-4 ${order.deliveryMethod === 'vault' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <h3 className="font-bold text-lg mb-2">Secure Vault</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Stored in fully insured, audited facilities. Sell back instantly 24/7.
                                    </p>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li className="flex gap-2"><ShieldCheck className="w-3 h-3 text-green-500" /> Fully Allocated</li>
                                        <li className="flex gap-2"><ShieldCheck className="w-3 h-3 text-green-500" /> Tax Free (in Bond)</li>
                                    </ul>
                                </div>

                                <div
                                    onClick={() => setOrder({ ...order, deliveryMethod: 'delivery' })}
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:bg-muted/50 ${order.deliveryMethod === 'delivery' ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                                >
                                    <Truck className={`w-8 h-8 mb-4 ${order.deliveryMethod === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <h3 className="font-bold text-lg mb-2">Home Delivery</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Secure, insured shipping to your verified address via armored transport.
                                    </p>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li className="flex gap-2"><Info className="w-3 h-3 text-orange-500" /> Shipping Fees Apply</li>
                                        <li className="flex gap-2"><Info className="w-3 h-3 text-orange-500" /> Sales Tax May Apply</li>
                                    </ul>
                                </div>
                            </div>

                            {order.deliveryMethod === 'vault' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <Label>Select Vault Location</Label>
                                    <Select
                                        value={order.vaultLocationId}
                                        onValueChange={(v) => setOrder({ ...order, vaultLocationId: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(vaults) && vaults.map(v => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.city}, {v.country} ({v.storage_fee_percent}%)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {order.deliveryMethod === 'delivery' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-muted p-4 rounded border">
                                        <p className="text-sm font-medium">Shipping Address</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {user?.firstName} {user?.lastName}<br />
                                            {/* user address coming soon via context updates */}
                                            123 Verified St<br />
                                            Zurich, Switzerland
                                        </p>
                                        <p className="text-xs text-primary mt-2 cursor-pointer">Change Address (Requires KYC Update)</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep('config')}>Back</Button>
                                <Button onClick={handleDeliverySubmit} disabled={order.deliveryMethod === 'vault' && !order.vaultLocationId}>Review Order</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 'review' && selectedProduct && (
                        <div className="max-w-xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Review & Confirm</h2>

                            <div className="bg-muted/50 rounded-xl p-6 mb-6 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <span className="font-semibold">{selectedProduct.name} x{order.quantity}</span>
                                    <span className="font-mono">{(weight * order.quantity)}oz</span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Metal Spot Price ({spotPrice.toFixed(2)}/oz)</span>
                                        <span>${costs.spotTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Dealer Premium</span>
                                        <span>${costs.premiumTotal.toFixed(2)}</span>
                                    </div>
                                    {order.deliveryMethod === 'delivery' && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Insured Shipping</span>
                                            <span>${costs.shipping.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.deliveryMethod === 'delivery' && (
                                        <div className="flex justify-between text-orange-600/80">
                                            <span>Estimated Sales Tax (8%)</span>
                                            <span>${costs.tax.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-end pt-4 border-t">
                                    <span className="font-bold text-lg">Total Cost</span>
                                    <span className="font-bold text-2xl text-primary">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {order.deliveryMethod === 'vault' && (
                                <div className="bg-blue-500/10 text-blue-600 p-4 rounded-lg mb-6 text-sm flex gap-3">
                                    <ShieldCheck className="shrink-0" />
                                    <p>Your assets will be physically allocated in our {Array.isArray(vaults) ? vaults.find(v => v.id === order.vaultLocationId)?.city : ''} vault.</p>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep('delivery')}>Back</Button>
                                <Button size="lg" variant="gold" className="w-full md:w-auto" onClick={handleConfirm} disabled={buy.isPending}>
                                    {buy.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Confirm Transaction (${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS STEP */}
                    {step === 'success' && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Order Placed Successfully</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                Your transaction for <strong>{order.quantity}x {selectedProduct?.name || 'Investment Metals'}</strong> has been processed.
                                {order.deliveryMethod === 'vault'
                                    ? ' The assets are being allocated to your vault storage.'
                                    : ' You will receive a tracking number via email once the shipment is insured and dispatched.'}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button variant="outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
                                <Button onClick={() => { setStep('product'); setOrder({ ...order, quantity: 1, productId: '' }); }}>Buy More</Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-8">
                Live market prices update every 60 seconds. Final price locked for 10 minutes at checkout.
            </p>
        </div>
    );
}
