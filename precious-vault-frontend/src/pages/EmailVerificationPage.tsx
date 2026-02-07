import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function EmailVerificationPage() {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const navigate = useNavigate();
    const { user, checkAuth } = useAuth();

    useEffect(() => {
        // Send OTP on mount
        handleResendOtp();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value !== '' && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        setError('');
        try {
            await api.post('/users/profile/send_otp/');
        } catch (err: any) {
            console.error('Failed to resend OTP:', err);
            setError('Failed to send verification code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 4) {
            setError('Please enter the 4-digit code');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await api.post('/users/profile/verify_otp/', { code });
            setIsSuccess(true);
            await checkAuth();
            setTimeout(() => {
                navigate('/onboarding');
            }, 2000);
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout showFooter={false}>
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="card-premium">
                        <div className="text-center mb-8">
                            <div className="h-12 w-12 rounded-xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-6 w-6 text-slate-dark" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
                            <p className="text-muted-foreground mt-2">
                                We've sent a 4-digit code to <span className="text-foreground font-medium">{user?.email}</span>
                            </p>
                        </div>

                        {isSuccess ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground">Email Verified!</h2>
                                <p className="text-muted-foreground">Redirecting you to onboarding...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-between gap-4 max-w-[280px] mx-auto">
                                    {otp.map((digit, index) => (
                                        <div key={index} className="w-14 h-14">
                                            <Input
                                                ref={inputRefs[index]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                className="w-full h-full text-center text-2xl font-bold rounded-xl border-2 focus:border-primary focus:ring-primary"
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading || otp.join('').length !== 4}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : 'Verify Email'}
                                </Button>

                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Didn't receive the code?{' '}
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isResending}
                                            className="text-primary font-medium hover:underline disabled:opacity-50"
                                        >
                                            {isResending ? 'Sending...' : 'Resend Code'}
                                        </button>
                                    </p>
                                </div>
                            </form>
                        )}

                        <div className="mt-12 pt-6 border-t border-border">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    Step 1: Verify Email
                                </div>
                                <div className="flex items-center gap-1 opacity-50">
                                    Step 2: Onboarding
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
