import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle2, Lock, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVaults } from '@/hooks/useVaults';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Step = 'account' | 'identity' | 'security' | 'complete';

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>('account');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, checkAuth } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { data: vaults } = useVaults();

    useEffect(() => {
        // Redirect if not verified
        if (user && !user.isEmailVerified) {
            navigate('/verify-email');
        }
    }, [user, navigate]);

    // Form States
    const [formData, setFormData] = useState({
        phone: '',
        street: '',
        city: '',
        zip: '',
        country: 'Switzerland',
        preferredVault: user?.preferredVault || ''
    });

    useEffect(() => {
        if (!user) return;
        setFormData(prev => ({
            ...prev,
            phone: prev.phone || user.phoneNumber || '',
            preferredVault: prev.preferredVault || user.preferredVault || ''
        }));
    }, [user]);

    const getProgress = () => {
        switch (step) {
            case 'account': return 25;
            case 'identity': return 50;
            case 'security': return 75;
            case 'complete': return 100;
            default: return 0;
        }
    };

    const handleAccountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('identity');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            setError('Please upload your government ID to continue.');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            // 1. Upload the ID document
            const uploadFormData = new FormData();
            uploadFormData.append('document', selectedFile);
            await api.post('/users/profile/upload_id/', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Submit complete profile and address data
            await api.post('/users/profile/submit_kyc/', {
                phone_number: formData.phone,
                street: formData.street,
                city: formData.city,
                zip_code: formData.zip,
                country: formData.country,
                state: '', // Optional
                preferred_vault: formData.preferredVault || undefined
            });

            // Refresh auth state to get verified status
            await checkAuth();
            setStep('security');
        } catch (err: any) {
            console.error('Identity submission error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSecuritySubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.post('/users/profile/enable_2fa/', { enabled: true });

            // Refresh auth state
            await checkAuth();
            setStep('complete');
        } catch (err: any) {
            console.error('2FA error:', err);
            setError('Failed to enable 2FA.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
            {/* Header / Logo Area */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Fortress Vault</h1>
                <p className="text-white/60">Secure Institutional Onboarding</p>
            </div>

            <Card className="w-full max-w-2xl border-white/10 bg-card/95 backdrop-blur shadow-2xl">
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <CardTitle className="text-2xl">Account Setup</CardTitle>
                        <span className="text-sm text-muted-foreground">Step {step === 'complete' ? 4 : ['account', 'identity', 'security'].indexOf(step) + 1} of 4</span>
                    </div>
                    <Progress value={getProgress()} className="h-2" />
                </CardHeader>

                <CardContent className="pt-6">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 'account' && (
                        <form id="account-form" onSubmit={handleAccountSubmit} className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-lg border border-border flex gap-3 text-sm text-muted-foreground mb-6">
                                <Shield className="h-5 w-5 text-primary shrink-0" />
                                <p>Welcome, <span className="text-foreground font-semibold">{user?.firstName} {user?.lastName}</span>. Let's finish setting up your account.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (for secure alerts)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </form>
                    )}

                    {step === 'identity' && (
                        <form id="identity-form" onSubmit={handleIdentitySubmit} className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-3 text-sm text-muted-foreground mb-6">
                                <Shield className="h-5 w-5 text-primary shrink-0" />
                                <p>We are required by international law to verify your identity before enabling gold vaults.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Street Address</Label>
                                    <Input
                                        required
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        required
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Zip / Postal Code</Label>
                                    <Input
                                        required
                                        value={formData.zip}
                                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input
                                        required
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>


                                <div className="space-y-2 col-span-2">
                                    <Label>Preferred Vault Location</Label>
                                    <Select
                                        value={formData.preferredVault}
                                        onValueChange={(value) => setFormData({ ...formData, preferredVault: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your preferred vault" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(vaults) && vaults.map((vault) => (
                                                <SelectItem key={vault.id} value={vault.id}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{vault.flag_emoji || '🌐'}</span>
                                                        <span>{vault.city}, {vault.country}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                />
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${selectedFile ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/20'}`}>
                                    {selectedFile ? (
                                        <CheckCircle2 className="h-6 w-6 text-primary" />
                                    ) : (
                                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                    )}
                                </div>
                                <h3 className="font-semibold mb-1">
                                    {selectedFile ? 'ID Document Selected' : 'Upload Government ID'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedFile ? selectedFile.name : 'Passport or Driver\'s License'}
                                </p>
                            </div>
                        </form>
                    )}

                    {step === 'security' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Secure Your Vault</h3>
                                <p className="text-muted-foreground">Enable 2-Factor Authentication to protect your assets.</p>
                            </div>

                            <div className="bg-white p-4 rounded-lg w-48 h-48 mx-auto border shadow-inner flex items-center justify-center">
                                {/* Mock QR Code */}
                                <div className="w-full h-full bg-black/5 grid grid-cols-6 grid-rows-6 gap-1 p-2">
                                    {Array.from({ length: 36 }).map((_, i) => (
                                        <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                Displaying QR Code for Authenticator App...
                            </div>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Verification Complete</h2>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                Your institutional account is now active. You have full access to global vaults and trading markets.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-6">
                    {step === 'complete' ? (
                        <Button className="w-full" size="lg" onClick={() => navigate('/dashboard')}>
                            Enter Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (step === 'identity') setStep('account');
                                    if (step === 'security') setStep('identity');
                                }}
                                disabled={step === 'account' || isLoading}
                            >
                                Back
                            </Button>

                            {step === 'account' && (
                                <Button form="account-form" type="submit">
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}

                            {step === 'identity' && (
                                <Button form="identity-form" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : 'Verify Identity'}
                                </Button>
                            )}

                            {step === 'security' && (
                                <Button onClick={handleSecuritySubmit} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Activating...
                                        </>
                                    ) : 'Enable 2FA & Finish'}
                                </Button>
                            )}
                        </>
                    )}
                </CardFooter>
            </Card>

            <p className="mt-8 text-white/40 text-xs">
                © 2024 Fortress Vault Group. Regulated by FINMA (Mock).
            </p>
        </div>
    );
}
