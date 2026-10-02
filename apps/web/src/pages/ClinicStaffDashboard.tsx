import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Users, Calendar, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

const ClinicStaffDashboard = () => {
  const [todayCheckIns, setTodayCheckIns] = useState([
    {
      id: '1',
      patientName: 'Amit Kumar',
      appointmentTime: '09:30 AM',
      tokenNumber: 1,
      status: 'CHECKED_IN',
      doctor: 'Dr. Sharma',
    },
    {
      id: '2',
      patientName: 'Priya Singh',
      appointmentTime: '10:00 AM',
      tokenNumber: 2,
      status: 'CHECKED_IN',
      doctor: 'Dr. Patel',
    },
    {
      id: '3',
      patientName: 'Rajesh Patel',
      appointmentTime: '10:30 AM',
      tokenNumber: 3,
      status: 'PENDING_CHECKIN',
      doctor: 'Dr. Sharma',
    },
  ]);

  const [pendingPayments, setPendingPayments] = useState([
    {
      id: '1',
      patientName: 'Neha Verma',
      amount: 2000,
      doctor: 'Dr. Sharma',
      status: 'PENDING',
      appointmentId: 'APT001',
    },
    {
      id: '2',
      patientName: 'Vikram Singh',
      amount: 1500,
      doctor: 'Dr. Patel',
      status: 'PENDING',
      appointmentId: 'APT002',
    },
  ]);

  const handleCheckIn = (id: string) => {
    setTodayCheckIns(
      todayCheckIns.map((item) =>
        item.id === id ? { ...item, status: 'CHECKED_IN' } : item
      )
    );
  };

  const handlePaymentDone = (id: string) => {
    setPendingPayments(pendingPayments.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinic Reception Dashboard</h1>
          <p className="text-gray-600">Manage patient check-ins, queue, and payments</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              icon: Users,
              label: "Today's Appointments",
              value: todayCheckIns.length,
              color: 'primary',
            },
            {
              icon: CheckCircle,
              label: 'Checked In',
              value: todayCheckIns.filter((c) => c.status === 'CHECKED_IN').length,
              color: 'success',
            },
            {
              icon: Clock,
              label: 'Pending Check-in',
              value: todayCheckIns.filter((c) => c.status === 'PENDING_CHECKIN').length,
              color: 'warning',
            },
            {
              icon: AlertCircle,
              label: 'Pending Payments',
              value: pendingPayments.length,
              color: 'danger',
            },
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 opacity-50 text-${stat.color}-600`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="checkin" className="space-y-4">
          <TabsList>
            <TabsTrigger value="checkin">Check-in Management</TabsTrigger>
            <TabsTrigger value="queue">Queue Display</TabsTrigger>
            <TabsTrigger value="payments">Payment Collection</TabsTrigger>
          </TabsList>

          {/* Check-in Tab */}
          <TabsContent value="checkin">
            <Card>
              <CardHeader>
                <CardTitle>Patient Check-in</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayCheckIns.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-gray-900">{patient.patientName}</p>
                          <Badge
                            variant={
                              patient.status === 'CHECKED_IN'
                                ? 'success'
                                : patient.status === 'PENDING_CHECKIN'
                                  ? 'warning'
                                  : 'default'
                            }
                          >
                            {patient.status === 'CHECKED_IN' ? '✓ Checked In' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-sm text-gray-600">
                          <span>Token: #{patient.tokenNumber}</span>
                          <span>Time: {patient.appointmentTime}</span>
                          <span>Doctor: {patient.doctor}</span>
                        </div>
                      </div>
                      {patient.status === 'PENDING_CHECKIN' && (
                        <Button size="sm" onClick={() => handleCheckIn(patient.id)}>
                          Check In
                        </Button>
                      )}
                      {patient.status === 'CHECKED_IN' && (
                        <Badge variant="success">✓ Done</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Display Tab */}
          <TabsContent value="queue">
            <div className="grid grid-cols-2 gap-6">
              {/* Current Queue */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {todayCheckIns
                      .filter((c) => c.status === 'CHECKED_IN')
                      .map((patient, idx) => (
                        <div
                          key={patient.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{patient.patientName}</p>
                              <p className="text-xs text-gray-600">Token #{patient.tokenNumber}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {patient.doctor}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* TV Display Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>TV Display Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-white p-6 rounded-lg text-center space-y-4">
                    <p className="text-sm text-gray-400">WAITING HALL DISPLAY</p>
                    <div className="bg-gray-800 p-4 rounded">
                      <p className="text-xs text-gray-500 mb-2">Now Serving</p>
                      <p className="text-6xl font-bold text-primary-400">
                        #{todayCheckIns.find((c) => c.status === 'CHECKED_IN')?.tokenNumber || '-'}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-400">at</p>
                      <p className="font-medium">
                        {todayCheckIns.find((c) => c.status === 'CHECKED_IN')?.doctor || 'Cabin A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payment Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPayments.length > 0 ? (
                    pendingPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium text-gray-900">{payment.patientName}</p>
                            <Badge variant="warning">Pending</Badge>
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span>{payment.doctor}</span>
                            <span>Apt: {payment.appointmentId}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">₹{payment.amount}</p>
                            <p className="text-xs text-gray-600">Amount Due</p>
                          </div>
                          <Button
                            onClick={() => handlePaymentDone(payment.id)}
                            className="ml-4"
                          >
                            Paid
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">All payments collected!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClinicStaffDashboard;
