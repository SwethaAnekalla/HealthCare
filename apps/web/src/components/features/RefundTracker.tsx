import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface RefundEvent {
  id: string;
  status: string;
  message: string;
  createdAt: string;
}

interface RefundTrackerProps {
  refund: {
    id: string;
    amount: number;
    status: string;
    destination: string;
    slaExpectedAt: string;
    slaBreached: boolean;
    events: RefundEvent[];
  };
}

export const RefundTracker = ({ refund }: RefundTrackerProps) => {
  const steps = ['REQUESTED', 'APPROVED', 'PROCESSING', 'CREDITED'];
  const currentStepIndex = steps.indexOf(refund.status);

  const getStepIcon = (index: number) => {
    if (index < currentStepIndex) {
      return <CheckCircle className="w-6 h-6 text-success-600" />;
    } else if (index === currentStepIndex) {
      return <Clock className="w-6 h-6 text-warning-600 animate-spin" />;
    } else {
      return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREDITED':
        return 'success';
      case 'REJECTED':
      case 'FAILED':
        return 'danger';
      case 'APPROVED':
      case 'PROCESSING':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Refund Status</CardTitle>
          <Badge variant={getStatusColor(refund.status)}>
            {refund.status === 'CREDITED' ? '✓ Completed' : refund.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount and Destination */}
        <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4">
          <div>
            <p className="text-sm text-gray-600">Refund Amount</p>
            <p className="text-2xl font-bold text-gray-900">₹{refund.amount / 100}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Destination</p>
            <p className="font-medium text-gray-900 capitalize">
              {refund.destination.toLowerCase().replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Timeline/Stepper */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Progress</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-start space-x-4">
                {getStepIcon(index)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {step.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  {index < currentStepIndex && (
                    <p className="text-xs text-success-600">
                      {refund.events.find((e) => e.status === step)?.createdAt
                        ? new Date(
                            refund.events.find((e) => e.status === step)?.createdAt || '',
                          ).toLocaleDateString()
                        : 'Completed'}
                    </p>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`ml-3 h-8 w-0.5 ${
                      index < currentStepIndex ? 'bg-success-600' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Timeline</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {refund.events.map((event) => (
              <div key={event.id} className="text-sm border-l-2 border-primary-300 pl-3 py-1">
                <p className="font-medium text-gray-700">{event.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Breach Warning */}
        {refund.slaBreached && (
          <div className="flex items-start space-x-3 p-4 bg-danger-50 rounded-lg border border-danger-200">
            <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger-900">SLA Breach</p>
              <p className="text-xs text-danger-700">
                Refund exceeded expected processing time. Contact support for escalation.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
