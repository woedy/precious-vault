import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTrading } from '@/hooks/useTrading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, Wallet, CreditCard, Landmark, Coins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DEPOSIT_METHODS = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Instant deposit, 2.5% fee' },
    { id: 'bank', name: 'Bank Transfer', icon: Landmark, description: '1-3 business days, no fee' },
    { id: 'crypto', name: 'Cryptocurrency', icon: Coins, description: 'Fast, secure, variable fees' },
];

export default function DepositPage() {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('card');
    const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');
    const navigate = useNavigate();
    const { deposit } = useTrading();
    const { user, checkAuth } = useAuth();

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;

        setStep('processing');
        try {
            await deposit.mutateAsync({ amount: parseFloat(amount) });
            await checkAuth(); // Refresh user profile to get new balance
            setStep('success');
        } catch (error) {
            setStep('amount');
            console.error("Deposit failed", error);
        }
    };

    const handleBack = () => {
        if (step === 'success') {
            navigate('/dashboard');
        } else {
            setStep('amount');
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 group transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>

                    {step === 'amount' && (
                        <div className="space-y-6">
                            <div className="mb-8">
                                <h1 className="text-4xl font-bold tracking-tight mb-2">Fund Your Wallet</h1>
                                <p className="text-muted-foreground text-lg">Add cash to your account to start investing in precious metals.</p>
                            </div>

                            <Card className="border-border/50 shadow-lg">
                                <CardHeader>
                                    <CardTitle>Deposit Details</CardTitle>
                                    <CardDescription>Enter the amount you would like to add to your balance.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-sm font-medium">Deposit Amount (USD)</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="pl-10 h-16 text-3xl font-bold bg-muted/30 focus-visible:ring-gold"
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            {[100, 500, 1000, 5000].map(val => (
                                                <Button
                                                    key={val}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAmount(val.toString())}
                                                    className="rounded-full px-4"
                                                >
                                                    +${val}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">Select Payment Method</Label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {DEPOSIT_METHODS.map((m) => {
                                                const Icon = m.icon;
                                                return (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => setMethod(m.id)}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${method === m.id
                                                                ? 'border-gold bg-gold/5 shadow-sm'
                                                                : 'border-border hover:border-border/80 hover:bg-muted/30'
                                                            }`}
                                                    >
                                                        <div className={`p-3 rounded-lg ${method === m.id ? 'bg-gold text-slate-dark' : 'bg-muted text-muted-foreground'}`}>
                                                            <Icon className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold">{m.name}</p>
                                                            <p className="text-xs text-muted-foreground">{m.description}</p>
                                                        </div>
                                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${method === m.id ? 'border-gold bg-gold' : 'border-muted-foreground/30'}`}>
                                                            {method === m.id && <div className="h-2 w-2 rounded-full bg-slate-dark" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-secondary/20 p-4 rounded-xl space-y-2 border border-border/50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Fees</span>
                                            <span className="font-medium">{method === 'card' ? '2.5%' : '0.0%'}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/50">
                                            <span>Total to Pay</span>
                                            <span className="text-primary">
                                                ${(parseFloat(amount || '0') * (method === 'card' ? 1.025 : 1.0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="gold"
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold shadow-lg"
                                        onClick={handleDeposit}
                                        disabled={!amount || parseFloat(amount) <= 0 || deposit.isPending}
                                    >
                                        Confirm Deposit
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground italic">
                                        Secured by Bank-Grade Encryption. Your funds are protected.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full border-4 border-gold/20 animate-pulse" />
                                <Loader2 className="h-24 w-24 text-gold animate-spin absolute inset-0" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2 text-foreground">Authorizing Transaction</h2>
                                <p className="text-muted-foreground">Connecting to the secure payment gateway...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <Card className="border-border/50 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                            <div className="h-2 bg-success" />
                            <CardHeader className="text-center pt-10 pb-6">
                                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <CheckCircle2 className="h-10 w-10 text-success" />
                                </div>
                                <CardTitle className="text-3xl font-bold text-foreground">Deposit Successful!</CardTitle>
                                <CardDescription className="text-lg">Your funds are now available in your Precious Vault wallet.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 px-8 pb-10">
                                <div className="bg-muted/50 p-6 rounded-2xl border border-border/50 space-y-4 shadow-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-muted-foreground">Amount Added</span>
                                        <span className="text-2xl font-bold text-success">+${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-muted-foreground">New Balance</span>
                                        <span className="text-xl font-bold text-foreground">${(user?.walletBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 h-14 font-semibold"
                                        onClick={() => {
                                            setAmount('');
                                            setStep('amount');
                                        }}
                                    >
                                        Deposit More
                                    </Button>
                                    <Button
                                        variant="gold"
                                        size="lg"
                                        className="flex-1 h-14 font-bold shadow-lg"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Go to Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </Layout>
    );
}
