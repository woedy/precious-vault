import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetalCardProps {
  id?: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  unit: string;
  color?: string;
  icon: string;
  imageUrl?: string | null;
  onBuy?: () => void;
  onSell?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

export function MetalCard({
  name,
  symbol,
  price,
  change,
  unit,
  icon,
  imageUrl,
  onBuy,
  onSell,
  showActions = true,
  variant = 'default'
}: MetalCardProps) {
  const isPositive = change >= 0;

  return (
    <div className={cn(
      "card-premium hover-lift group",
      variant === 'compact' && "p-4"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={`${name} icon`} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="text-3xl">{icon}</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <span className="text-sm text-muted-foreground">{symbol}</span>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          isPositive
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? '+' : ''}{change}%
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-foreground">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-muted-foreground">per {unit}</div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button
            variant="gold"
            className="flex-1"
            onClick={onBuy}
          >
            Buy
          </Button>
          {onSell && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSell}
            >
              Sell
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
