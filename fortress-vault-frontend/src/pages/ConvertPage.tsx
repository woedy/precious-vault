import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTrading } from '@/hooks/useTrading';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, Banknote, Loader2, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConvertPage() {
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useDashboardData();
  const { convert } = useTrading();
  const { data: metalPrices } = useMetalPrices();
  const { data: platformSettings } = useQuery<{ metals_buying_enabled: boolean; metals_selling_enabled: boolean; metals_convert_enabled: boolean }>({
    queryKey: ['platform', 'settings'],
    queryFn: async () => {
      const res = await api.get('/trading/platform/settings/');
      return res.data;
    },
    staleTime: 15000,
  });

  const holdings = Array.isArray(dashboard?.portfolio_items) ? dashboard?.portfolio_items.filter(i => i.status === 'vaulted') : [];
  const selected = holdings.find((h) => h.id === selectedHoldingId);
  const amountValue = amount ? parseFloat(amount) : 0;
  // Use current_price from metal (cast to number for string safety)
  const liveSpotPrice = metalPrices?.metals?.find((m) => m.id === selected?.metal.id)?.price_usd_per_oz;
  const spotPrice = Number(liveSpotPrice ?? selected?.metal.current_price ?? 0);
  const cashValue = selected ? amountValue * spotPrice * 0.98 : 0; // 2% conversion fee

  const handleConvert = () => {
    setErrorMessage(null);
    if (platformSettings && platformSettings.metals_convert_enabled === false) {
      setErrorMessage('Convert to cash is temporarily unavailable. Please contact an administrator.');
      return;
    }
    if (selected && amount) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setErrorMessage(null);
    if (platformSettings && platformSettings.metals_convert_enabled === false) {
      setErrorMessage('Convert to cash is temporarily unavailable. Please contact an administrator.');
      setStep('select');
      return;
    }
    try {
      await convert.mutateAsync({
        portfolio_item_id: selected.id,
        amount_oz: parseFloat(amount)
      });
      setStep('success');
    } catch (error: any) {
      console.error("Conversion failed", error);
      setErrorMessage(error.response?.data?.error || 'We could not complete your conversion right now.');
      setStep('select');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
    } else if (step === 'success') {
      setStep('select');
      setSelectedHoldingId('');
      setAmount('');
    }
  };

  const amountOptions = selected
    ? [
      { value: '1', label: '1 oz' },
      { value: '5', label: '5 oz' },
      { value: '10', label: '10 oz' },
      { value: selected.weight_oz.toString(), label: `All (${selected.weight_oz} oz)` },
    ].filter(opt => parseFloat(opt.value) <= selected.weight_oz)
    : [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {step === 'select' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Convert to Cash</h1>
              <p className="text-muted-foreground">
                Convert your precious metals holdings to cash with instant settlement.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="max-w-lg mx-auto">
              <div className="card-premium mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Instant Conversion</h2>
                    <p className="text-sm text-muted-foreground">Same-day settlement to your balance</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Select Metal Holding</Label>
                    <Select value={selectedHoldingId} onValueChange={(v) => { setSelectedHoldingId(v); setAmount(''); }}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a holding" />
                      </SelectTrigger>
                      <SelectContent>
                        {holdings.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            <span className="flex items-center gap-2">
                              <span>{h.metal.symbol === 'Au' ? '🥇' : '🥈'}</span>
                              <span>{h.metal.name}</span>
                              <span className="text-muted-foreground">({h.weight_oz} oz)</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {holdings.length === 0 && <p className="text-sm text-muted-foreground mt-2">No vaulted holdings available to convert.</p>}
                  </div>

                  {selectedHoldingId && selected && (
                    <div>
                      <Label>Amount to Convert</Label>
                      <Select value={amount} onValueChange={setAmount}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select amount" />
                        </SelectTrigger>
                        <SelectContent>
                          {amountOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {amount && selected && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Metal Value</span>
                        <span className="text-foreground">
                          ${(amountValue * spotPrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Fee (2%)</span>
                        <span className="text-foreground">
                          -${(amountValue * spotPrice * 0.02).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t border-border">
                        <span className="text-foreground">Cash You'll Receive</span>
                        <span className="text-success">
                          ${cashValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={handleConvert}
                    disabled={!selectedHoldingId || !amount || platformSettings?.metals_convert_enabled === false}
                  >
                    Convert to Cash
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>💡 Converted cash is added to your Fortress Vault balance instantly.</p>
                <p>Withdraw to your bank account anytime.</p>
              </div>
            </div>
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
              <h2 className="text-xl font-semibold text-foreground mb-6">Confirm Conversion</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <span className="text-3xl">{selected.metal.symbol === 'Au' ? '🥇' : '🥈'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{selected.metal.name}</p>
                    <p className="text-sm text-muted-foreground">{amount} oz → Cash</p>
                  </div>
                  <Banknote className="h-6 w-6 text-success" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Metal Value</span>
                    <span className="text-foreground">
                      ${(amountValue * spotPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Fee</span>
                    <span className="text-foreground">
                      -${(amountValue * spotPrice * 0.02).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span className="text-foreground">Cash to Receive</span>
                    <span className="text-success">
                      ${cashValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={convert.isPending}
                >
                  {convert.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Confirm Conversion
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Funds will be credited to your cash balance immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && selected && (
          <div className="max-w-md mx-auto text-center">
            <div className="card-premium">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Conversion Complete!</h2>
              <p className="text-muted-foreground mb-6">
                {amount} oz of {selected.metal.name} has been converted to cash.
              </p>

              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added to Balance</span>
                  <span className="font-semibold text-success">
                    +${cashValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                >
                  Convert More
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  View Balance
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
