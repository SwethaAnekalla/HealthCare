import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, Clock, Navigation } from 'lucide-react';

interface QueuePosition {
  tokenNumber: number;
  position: number;
  tokensAhead: number;
  eta: string;
  status: string;
  averagePaceSeconds: number;
}

const QueueTrackerPage = () => {
  const { appointmentId } = useParams();
  const [position, setPosition] = useState<QueuePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const response = await apiClient.get(`/queue/position/${appointmentId}`);
        setPosition(response.data.data);
      } catch (err) {
        setError('Failed to load queue position');
      } finally {
        setLoading(false);
      }
    };

    fetchPosition();
    // Poll every 10 seconds
    const interval = setInterval(fetchPosition, 10000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  const handleCheckIn = async () => {
    try {
      await apiClient.post('/queue/check-in', {
        appointmentId,
        checkInType: 'ON_SITE',
      });
      setCheckedIn(true);
      // Refetch position
      const response = await apiClient.get(`/queue/position/${appointmentId}`);
      setPosition(response.data.data);
    } catch (err) {
      setError('Failed to check in');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading queue information...</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-danger-800">No queue position found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const minutesWait = Math.ceil((position.tokensAhead * position.averagePaceSeconds) / 60);
  const etaTime = new Date(position.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Main Card */}
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Your Queue Status</CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Token Number - Large Display */}
            <div className="text-center">
              <p className="text-gray-600 mb-2">Your Token Number</p>
              <p className="text-6xl font-bold text-primary-600">#{position.tokenNumber}</p>
            </div>

            {/* Check-in Status */}
            {!checkedIn ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-900 font-medium mb-4">Ready to check in?</p>
                <Button onClick={handleCheckIn} className="w-full">
                  <Navigation size={18} className="mr-2" />
                  Check In On-Site
                </Button>
              </div>
            ) : (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <Badge variant="success" className="w-full text-center justify-center py-2">
                  ✓ Checked In
                </Badge>
              </div>
            )}

            {/* Position & ETA */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-50">
                <CardContent className="p-4 text-center">
                  <Users size={24} className="mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Position in Queue</p>
                  <p className="text-3xl font-bold text-gray-900">{position.position}</p>
                  {position.tokensAhead > 0 && (
                    <p className="text-xs text-gray-500">{position.tokensAhead} person(s) ahead</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="p-4 text-center">
                  <Clock size={24} className="mx-auto mb-2 text-warning-600" />
                  <p className="text-sm text-gray-600">Estimated Wait</p>
                  <p className="text-3xl font-bold text-gray-900">{minutesWait} min</p>
                  <p className="text-xs text-gray-500">Around {etaTime}</p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Queue Progress</p>
              <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center transition-all"
                  style={{ width: `${Math.min((position.position / Math.max(position.position + position.tokensAhead + 3, 10)) * 100, 100)}%` }}
                >
                  {position.position <= 3 && (
                    <span className="text-white text-xs font-bold">Next soon!</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Just started</span>
                <span>Your turn soon</span>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900 mb-2">💡 Pro tip</p>
              <p className="text-sm text-primary-800">
                We'll notify you when you're 2 people away. Make sure your notifications are enabled!
              </p>
            </div>

            {/* Details */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Queue Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={position.status === 'IN_QUEUE' ? 'success' : 'default'}>
                    {position.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Consultation Time</span>
                  <span className="font-medium">{Math.round(position.averagePaceSeconds / 60)} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Update Note */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Updates automatically every 10 seconds
        </p>
      </div>
    </div>
  );
};

export default QueueTrackerPage;
