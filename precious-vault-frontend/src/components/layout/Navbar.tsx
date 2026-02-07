import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Wallet } from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Buy', path: '/buy' },
  { name: 'Sell', path: '/sell' },
  { name: 'Vaults', path: '/vaults' },
  { name: 'Convert', path: '/convert' },
  { name: 'Activity', path: '/activity' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isLanding
        ? "bg-secondary/95 backdrop-blur-md border-b border-border/50"
        : "bg-background/95 backdrop-blur-md border-b border-border"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <span className="text-lg font-bold text-slate-dark">G</span>
            </div>
            <span className={cn(
              "text-xl font-bold",
              isLanding ? "text-white" : "text-foreground"
            )}>
              Precious Vault
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isAuth && (
            <div className="hidden md:flex items-center gap-1">
              {isLanding ? (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="gold" size="lg">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 bg-accent/50 px-3 py-1.5 rounded-lg border border-border mr-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Cash Balance</span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        ${(user?.walletBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Link to="/deposit">
                      <Button variant="gold" size="sm" className="h-8 px-2">
                        Deposit
                      </Button>
                    </Link>
                  </div>

                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "text-muted-foreground hover:text-foreground",
                          location.pathname === link.path && "text-primary bg-accent"
                        )}
                      >
                        {link.name}
                      </Button>
                    </Link>
                  ))}
                  <Link to="/settings" className="ml-1">
                    <Button variant="outline" size="sm">
                      Settings
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={cn("h-6 w-6", isLanding ? "text-white" : "text-foreground")} />
            ) : (
              <Menu className={cn("h-6 w-6", isLanding ? "text-white" : "text-foreground")} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={cn(
            "md:hidden py-4 border-t animate-fade-in",
            isLanding ? "border-white/10" : "border-border"
          )}>
            <div className="flex flex-col gap-2">
              {isLanding ? (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-white/80">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gold" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          location.pathname === link.path && "text-primary bg-accent"
                        )}
                      >
                        {link.name}
                      </Button>
                    </Link>
                  ))}
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      Settings
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
