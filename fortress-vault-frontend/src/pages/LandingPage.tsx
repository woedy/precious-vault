import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import {
  TrendingUp,
  Shield,
  Banknote,
  Globe,
  ArrowRight,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { features, steps, stats } from '@/data/mockData';

const iconMap: Record<string, any> = {
  TrendingUp,
  Shield,
  Banknote,
  Globe,
};

export default function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary min-h-[90vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-gold" />
              <span className="text-sm text-white/80">Secure. Insured. Trusted.</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Buy, Store, and Convert{' '}
              <span className="text-gradient-gold">Physical Gold</span>{' '}
              Securely
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Access the world's most trusted precious metals platform. Trade gold, silver, platinum with institutional-grade security and instant liquidity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup">
                <Button variant="gold" size="xl" className="group">
                  Get Started
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/vaults">
                <Button variant="dark" size="xl">
                  View Vaults
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-background" style={{
          clipPath: 'ellipse(70% 100% at 50% 100%)'
        }} />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Precious Metals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform for buying, storing, and converting precious metals with institutional-grade infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = iconMap[feature.icon];
              return (
                <div
                  key={index}
                  className="card-premium hover-lift group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start investing in precious metals in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="card-premium text-center">
                  <div className="text-4xl font-bold text-primary/20 mb-2">{step.number}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Investing?
            </h2>
            <p className="text-white/70 mb-8">
              Join thousands of investors who trust Fortress Vault for their precious metals portfolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="gold" size="xl">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="dark" size="xl">
                  Access Dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No minimum investment
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Instant account setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Bank-grade security
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
