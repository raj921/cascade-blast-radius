import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/types/analysis';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
}

const riskConfig = {
  CRITICAL: {
    label: 'Critical',
    className: 'bg-red-500 hover:bg-red-600 text-white',
    icon: AlertTriangle,
  },
  HIGH: {
    label: 'High',
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
    icon: AlertCircle,
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    icon: Info,
  },
  LOW: {
    label: 'Low',
    className: 'bg-green-500 hover:bg-green-600 text-white',
    icon: CheckCircle,
  },
};

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const config = riskConfig[risk];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className || ''} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Made with Bob
