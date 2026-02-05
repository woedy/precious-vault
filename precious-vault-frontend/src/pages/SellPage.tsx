import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { metals, portfolio } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function SellPage() {
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const navigate = useNavigate();

  const holdings = portfolio.holdings.map((h) => ({
    ...h,
    metal: metals.find((m) => m.id === h.metalId)!,
  }));

  const selected = holdings.find((h) => h.metalId === selectedMetal);

  const handleSell = () => {
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
      setSelectedMetal(null);
      setAmount('');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {step === 'select' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Sell Metals</h1>
              <p className="text-muted-foreground">Select from your holdings and enter the amount to sell.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {holdings.map((holding) => (
                <div
                  key={holding.metalId}
                  onClick={() => setSelectedMetal(holding.metalId)}
                  className={`card-premium cursor-pointer hover-lift ${selectedMetal === holding.metalId
                      ? 'ring-2 ring-primary'
                      : ''
                    }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{holding.metal.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{holding.metal.name}</h3>
                      <span className="text-sm text-muted-foreground">{holding.metal.symbol}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Holdings</span>
                      <span className="font-medium text-foreground">{holding.amount} oz</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Value</span>
                      <span className="font-medium text-foreground">
                        ${holding.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Market Price</span>
                      <span className="font-medium text-primary">
                        ${holding.metal.price.toFixed(2)}/oz
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedMetal && selected && (
              <div className="max-w-md mx-auto card-premium">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Sell {selected.metal.name}
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="amount">Amount (oz)</Label>
                      <span className="text-sm text-muted-foreground">
                        Available: {selected.amount} oz
                      </span>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={selected.amount}
                      className="h-11"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-primary"
                      onClick={() => setAmount(selected.amount.toString())}
                    >
                      Sell All
                    </Button>
                  </div>

                  {amount && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per oz</span>
                        <span className="text-foreground">${selected.metal.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="text-foreground">{amount} oz</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t border-border">
                        <span className="text-foreground">You'll Receive</span>
                        <span className="text-success">
                          ${(parseFloat(amount) * selected.metal.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={handleSell}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > selected.amount}
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
                  <span className="text-3xl">{selected.metal.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{selected.metal.name}</p>
                    <p className="text-sm text-muted-foreground">{amount} oz</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sale Value</span>
                    <span className="text-foreground">
                      ${(parseFloat(amount) * selected.metal.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trading Fee (0.5%)</span>
                    <span className="text-foreground">
                      -${(parseFloat(amount) * selected.metal.price * 0.005).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span className="text-foreground">You'll Receive</span>
                    <span className="text-success">
                      ${(parseFloat(amount) * selected.metal.price * 0.995).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={handleConfirm}
                >
                  Confirm Sale
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Funds will be added to your cash balance.
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

              <h2 className="text-2xl font-bold text-foreground mb-2">Sale Complete!</h2>
              <p className="text-muted-foreground mb-6">
                You've successfully sold {amount} oz of {selected.metal.name}.
              </p>

              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added to Balance</span>
                  <span className="font-semibold text-success">
                    +${(parseFloat(amount) * selected.metal.price * 0.995).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
