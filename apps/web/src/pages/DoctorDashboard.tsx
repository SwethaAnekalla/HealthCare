import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DoctorStatusBadge } from '../components/features/DoctorStatusBadge';
import { Users, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useQueueUpdates } from '../hooks/useSocket';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const { socket } = useQueueUpdates(user?.clinicId || '');
  
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState('AVAILABLE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Fetch doctor's appointments for today
        const response = await api.get('/appointments/doctor/list', {
          params: {
            date: today,
            limit: 20,
          },
        });

        if (response.data.success) {
          const appointments = response.data.data.items || [];

          setTodayAppointments(appointments);

          // Calculate queue status
          const completed = appointments.filter(
            (a: any) => a.status === 'COMPLETED',
          ).length;
          const inQueue = appointments.filter(
            (a: any) =>
              a.status === 'BOOKED' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN',
          ).length;

          setQueueStatus({
            totalTokens: appointments.length,
            currentToken: inQueue > 0 ? 1 : 0,
            tokensCompleted: completed,
            averageConsultationTime: 15,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch appointments:', err);
        setError(err.response?.data?.error?.message || 'Failed to load appointments');
        // Fallback to empty state
        setTodayAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAppointments();

      // Refresh every 30 seconds
      const interval = setInterval(fetchAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <DoctorStatusBadge status={currentStatus} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Today's Appointments", value: todayAppointments.length },
                {
                  icon: CheckCircle,
                  label: 'Completed',
                  value: todayAppointments.filter((a) => a.status === 'COMPLETED').length,
                },
                {
                  icon: Clock,
                  label: 'Avg Consultation',
                  value: `${queueStatus?.averageConsultationTime}m`,
                },
                {
                  icon: AlertCircle,
                  label: 'Queue Length',
                  value: queueStatus?.totalTokens,
                },
              ].map((stat, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <stat.icon className="w-8 h-8 text-primary-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Queue Console */}
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Queue Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Current Token Display */}
                    <div className="bg-primary-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-600 mb-2">Now Serving</p>
                      <p className="text-6xl font-bold text-primary-600">
                        #{queueStatus?.currentToken || '-'}
                      </p>
                    </div>

                    {/* Queue Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Total Tokens', value: queueStatus?.totalTokens },
                        {
                          label: 'In Queue',
                          value:
                            (queueStatus?.totalTokens || 0) -
                            (queueStatus?.tokensCompleted || 0),
                        },
                        { label: 'Completed', value: queueStatus?.tokensCompleted },
                      ].map((stat, idx) => (
                        <div key={idx} className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Play size={18} className="mr-2" />
                        Call Next Patient
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Pause Queue
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Appointments */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Today's Appointments ({todayAppointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No appointments today
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todayAppointments.map((apt) => {
                          // Format time from ISO string
                          const appointmentTime = new Date(
                            apt.scheduledStart,
                          ).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });

                          return (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {apt.patientName}
                                </p>
                                <p className="text-sm text-gray-600">{apt.reason}</p>
                                {apt.consultationMode && (
                                  <p className="text-xs text-gray-500">
                                    Mode: {apt.consultationMode}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <p className="text-sm font-medium text-gray-600">
                                  {appointmentTime}
                                </p>
                                <Badge
                                  variant={
                                    apt.status === 'COMPLETED'
                                      ? 'success'
                                      : apt.status === 'CHECKED_IN' ||
                                          apt.status === 'IN_CONSULTATION'
                                        ? 'warning'
                                        : 'default'
                                  }
                                >
                                  {apt.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status Management Sidebar */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { value: 'AVAILABLE', label: '✓ Available' },
                    { value: 'RUNNING_LATE', label: '⏱ Running Late' },
                    { value: 'ON_BREAK', label: '⏸ On Break' },
                    { value: 'IN_SURGERY', label: '🏥 In Surgery' },
                    { value: 'ON_LEAVE', label: '📅 On Leave' },
                  ].map((status) => (
                    <Button
                      key={status.value}
                      variant={currentStatus === status.value ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setCurrentStatus(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default DoctorDashboard;
