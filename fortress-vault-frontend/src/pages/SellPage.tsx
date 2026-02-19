import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTrading } from '@/hooks/useTrading';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function SellPage() {
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [soldMeta, setSoldMeta] = useState<{ metalName: string; metalSymbol: string; amountOz: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useDashboardData();
  const { sell } = useTrading();
  const { data: metalPrices } = useMetalPrices();
  const { data: platformSettings } = useQuery<{ metals_buying_enabled: boolean; metals_selling_enabled: boolean }>({
    queryKey: ['platform', 'settings'],
    queryFn: async () => {
      const res = await api.get('/trading/platform/settings/');
      return res.data;
    },
    staleTime: 15000,
  });

  // Use portfolio_items so we can sell specific items (with IDs)
  // We filter to only show items that can be sold (e.g. vaulted)
  const holdings = Array.isArray(dashboard?.portfolio_items) ? dashboard?.portfolio_items.filter(i => i.status === 'vaulted') : [];
  const selected = holdings.find((h) => h.id === selectedHoldingId);
  const liveSpotPrice = metalPrices?.metals?.find((m) => m.id === selected?.metal.id)?.price_usd_per_oz;
  const spotPrice = Number(liveSpotPrice ?? selected?.metal.current_price ?? 0);
  const selectedWeight = Number(selected?.weight_oz || 0);

  const handleSell = () => {
    setErrorMessage(null);
    if (platformSettings && platformSettings.metals_selling_enabled === false) {
      setErrorMessage('Selling is currently paused by the platform administrator. Please try again later.');
      return;
    }

    if (selected && amount) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setErrorMessage(null);

    if (platformSettings && platformSettings.metals_selling_enabled === false) {
      setErrorMessage('Selling is currently paused by the platform administrator. Please try again later.');
      setStep('select');
      return;
    }

    try {
      setSoldMeta({
        metalName: selected.metal.name,
        metalSymbol: selected.metal.symbol,
        amountOz: amount,
      });
      await sell.mutateAsync({
        portfolio_item_id: selected.id,
        amount_oz: parseFloat(amount)
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setStep('success');
    } catch (error: any) {
      console.error("Sale failed", error);
      setErrorMessage(error.response?.data?.error || 'We could not complete your sale right now. Please review your request and try again.');
      setStep('select');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
    } else if (step === 'success') {
      setStep('select');
      setSelectedHoldingId(null);
      setAmount('');
    }
  };

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {step === 'select' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Sell Metals</h1>
              <p className="text-muted-foreground">Select from your holdings and enter the amount to sell.</p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {holdings.map((holding) => (
                <div
                  key={holding.id}
                  onClick={() => setSelectedHoldingId(holding.id)}
                  className={`card-premium cursor-pointer hover-lift ${selectedHoldingId === holding.id
                    ? 'ring-2 ring-primary'
                    : ''
                    }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{holding.metal.symbol === 'Au' ? '🥇' : '🥈'}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{holding.metal.name}</h3>
                      <span className="text-sm text-muted-foreground">{holding.metal.symbol}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Holdings</span>
                      <span className="font-medium text-foreground">{Number(holding.weight_oz)} oz</span>
                    </div>
                    <span className="text-muted-foreground">Current Value</span>
                    <span className="font-medium text-foreground">
                      ${(Number(holding.weight_oz) * Number(holding.metal.current_price)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market Price</span>
                    <span className="font-medium text-primary">
                      ${Number(holding.metal.current_price).toFixed(2)}/oz
                    </span>
                  </div>
                </div>
              ))}
              {holdings.length === 0 && <p className="text-muted-foreground">You have no holdings to sell.</p>}
            </div>

            {selectedHoldingId && selected && (
              <div className="max-w-md mx-auto card-premium">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Sell {selected.metal.name}
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="amount">Amount (oz)</Label>
                      <span className="text-sm text-muted-foreground">
                        Available: {selected.weight_oz} oz
                      </span>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={selected.weight_oz}
                      className="h-11"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-primary"
                      onClick={() => setAmount(selected.weight_oz.toString())}
                    >
                      Sell All
                    </Button>
                  </div>

                  {amount && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per oz</span>
                        <span className="text-foreground">${spotPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="text-foreground">{amount} oz</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t border-border">
                        <span className="text-foreground">You'll Receive</span>
                        <span className="text-success">
                          ${(parseFloat(amount) * spotPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={handleSell}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > selectedWeight}
                  >
                    Continue to Sell
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'confirm' && selected && (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="card-premium">
              <h2 className="text-xl font-semibold text-foreground mb-6">Confirm Sale</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <span className="text-3xl">{selected.metal.symbol === 'Au' ? '🥇' : '🥈'}</span>
                  <div>
                    <p className="font-semibold text-foreground">{selected.metal.name}</p>
                    <p className="text-sm text-muted-foreground">{amount} oz</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sale Value</span>
                    <span className="text-foreground">
                      ${(parseFloat(amount) * spotPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trading Fee (0.5%)</span>
                    <span className="text-foreground">
                      -${(parseFloat(amount) * spotPrice * 0.005).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span className="text-foreground">You'll Receive</span>
                    <span className="text-success">
                      ${(parseFloat(amount) * spotPrice * 0.995).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={sell.isPending}
                >
                  {sell.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Confirm Sale
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Funds will be added to your cash balance.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && soldMeta && (
          <div className="max-w-md mx-auto text-center">
            <div className="card-premium">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Sale Complete!</h2>
              <p className="text-muted-foreground mb-6">
                You've successfully sold {soldMeta.amountOz} oz of {soldMeta.metalName}.
              </p>

              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added to Balance</span>
                  <span className="font-semibold text-success">
                    +${(parseFloat(amount) * spotPrice * 0.995).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                >
                  Sell More
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  View Portfolio
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
