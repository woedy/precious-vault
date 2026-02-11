import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  description?: string;
  onClick?: () => void;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  onClick,
  className,
}) => {
  const isClickable = !!onClick;

  // Determine trend direction
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value === 0) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? (
        <TrendingUp className="h-4 w-4 text-green-600" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-600" />
      );
    }
    
    // Auto-detect based on value
    return trend.value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend.value === 0) return 'text-muted-foreground';
    
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? 'text-green-600' : 'text-red-600';
    }
    
    return trend.value > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card
      className={cn(
        'transition-all',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-primary',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          
          {(trend || description) && (
            <div className="flex items-center space-x-2 text-xs">
              {trend && (
                <div className={cn('flex items-center space-x-1', getTrendColor())}>
                  {getTrendIcon()}
                  <span className="font-medium">
                    {Math.abs(trend.value)}%
                  </span>
                </div>
              )}
              
              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
