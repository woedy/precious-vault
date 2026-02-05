import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMockApp } from '@/context/MockAppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { login } = useMockApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    // Navigate to the institutional onboarding flow
    navigate('/onboarding');
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card-premium">
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-dark">G</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
              <p className="text-muted-foreground mt-2">Start investing in precious metals today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>

              <Button type="submit" variant="gold" size="lg" className="w-full">
                Create Account
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              {['No minimum investment', 'Instant vault access', '256-bit encryption'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-xs text-muted-foreground">
                🔒 Secure Registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
