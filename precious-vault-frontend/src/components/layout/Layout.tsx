import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  className?: string;
}

export function Layout({ children, showFooter = true, className }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn("flex-1 pt-16", className)}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
