import { Badge } from '../ui/Badge';
import { AlertCircle, CheckCircle, Clock, Pause } from 'lucide-react';

interface DoctorStatusBadgeProps {
  status: string;
  delayMinutes?: number;
  updatedAt?: string;
}

export const DoctorStatusBadge = ({ status, delayMinutes, updatedAt }: DoctorStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          icon: <CheckCircle size={14} className="inline mr-1" />,
          text: '✓ Available',
          variant: 'success',
        };
      case 'RUNNING_LATE':
        return {
          icon: <Clock size={14} className="inline mr-1" />,
          text: `Running ${delayMinutes || 5} min late`,
          variant: 'warning',
        };
      case 'ON_BREAK':
        return {
          icon: <Pause size={14} className="inline mr-1" />,
          text: 'On break',
          variant: 'default',
        };
      case 'ON_LEAVE':
        return {
          icon: <AlertCircle size={14} className="inline mr-1" />,
          text: 'On leave',
          variant: 'danger',
        };
      case 'UNAVAILABLE_TODAY':
        return {
          icon: <AlertCircle size={14} className="inline mr-1" />,
          text: 'Unavailable today',
          variant: 'danger',
        };
      default:
        return {
          icon: <AlertCircle size={14} className="inline mr-1" />,
          text: 'Offline',
          variant: 'default',
        };
    }
  };

  const config = getStatusConfig(status);
  const timeAgo = updatedAt ? `${Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000)}m ago` : '';

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={config.variant}>
        {config.icon}
        {config.text}
      </Badge>
      {timeAgo && <span className="text-xs text-gray-500">Updated {timeAgo}</span>}
    </div>
  );
};
