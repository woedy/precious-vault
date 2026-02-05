import { Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface VaultCardProps {
  city: string;
  country: string;
  flag: string;
  allocated: boolean;
  insured: boolean;
  storageFee: number;
  status: string;
  capacity: number;
  onSelect?: () => void;
}

export function VaultCard({
  city,
  country,
  flag,
  allocated,
  insured,
  storageFee,
  status,
  capacity,
  onSelect
}: VaultCardProps) {
  return (
    <div className="card-premium hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{flag}</span>
          <div>
            <h3 className="font-semibold text-foreground">{city}</h3>
            <span className="text-sm text-muted-foreground">{country}</span>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          status === 'active' 
            ? "bg-success/10 text-success" 
            : "bg-muted text-muted-foreground"
        )}>
          {status === 'active' ? 'Active' : 'Maintenance'}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Storage Fee</span>
          <span className="font-medium text-foreground">{storageFee}% / year</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capacity Used</span>
          <span className="font-medium text-foreground">{capacity}%</span>
        </div>
        <Progress value={capacity} className="h-2" />

        <div className="flex flex-wrap gap-2">
          {allocated && (
            <div className="flex items-center gap-1 text-xs bg-accent px-2 py-1 rounded-full">
              <Check className="h-3 w-3 text-primary" />
              Allocated
            </div>
          )}
          {insured && (
            <div className="flex items-center gap-1 text-xs bg-accent px-2 py-1 rounded-full">
              <Shield className="h-3 w-3 text-primary" />
              Insured
            </div>
          )}
        </div>
      </div>

      <Button variant="gold-outline" className="w-full" onClick={onSelect}>
        Select Vault
      </Button>
    </div>
  );
}
