import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { metals, portfolio } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, Banknote } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConvertPage() {
  const [selectedMetal, setSelectedMetal] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const navigate = useNavigate();

  const holdings = portfolio.holdings.map((h) => ({
    ...h,
    metal: metals.find((m) => m.id === h.metalId)!,
  }));

  const selected = holdings.find((h) => h.metalId === selectedMetal);
  const amountValue = amount ? parseFloat(amount) : 0;
  const cashValue = selected ? amountValue * selected.metal.price * 0.98 : 0; // 2% conversion fee

  const handleConvert = () => {
    if (selected && amount) {
      setStep('confirm');
    }
  };

  const handleConfirm = () => {
    setStep('success');
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
    } else if (step === 'success') {
      setStep('select');
      setSelectedMetal('');
      setAmount('');
    }
  };

  const amountOptions = selected
    ? [
      { value: '1', label: '1 oz' },
      { value: '5', label: '5 oz' },
      { value: '10', label: '10 oz' },
      { value: selected.amount.toString(), label: `All (${selected.amount} oz)` },
    ].filter(opt => parseFloat(opt.value) <= selected.amount)
    : [];

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
                    <Label>Select Metal</Label>
                    <Select value={selectedMetal} onValueChange={(v) => { setSelectedMetal(v); setAmount(''); }}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a metal" />
                      </SelectTrigger>
                      <SelectContent>
                        {holdings.map((h) => (
                          <SelectItem key={h.metalId} value={h.metalId}>
                            <span className="flex items-center gap-2">
                              <span>{h.metal.icon}</span>
                              <span>{h.metal.name}</span>
                              <span className="text-muted-foreground">({h.amount} oz)</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMetal && (
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
                          ${(amountValue * selected.metal.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Fee (2%)</span>
                        <span className="text-foreground">
                          -${(amountValue * selected.metal.price * 0.02).toFixed(2)}
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
                    disabled={!selectedMetal || !amount}
                  >
                    Convert to Cash
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>💡 Converted cash is added to your Precious Vault balance instantly.</p>
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
                  <span className="text-3xl">{selected.metal.icon}</span>
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
                      ${(amountValue * selected.metal.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Fee</span>
                    <span className="text-foreground">
                      -${(amountValue * selected.metal.price * 0.02).toFixed(2)}
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
                >
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
