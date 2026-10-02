import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import {
  BarChart3,
  Users,
  Stethoscope,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

const AdminDashboard = () => {
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  const dashboardStats = [
    { icon: Users, label: 'Total Patients', value: '2,451', trend: '+12%' },
    { icon: Stethoscope, label: 'Active Doctors', value: '342', trend: '+5%' },
    { icon: DollarSign, label: 'Total Revenue', value: '₹45.2L', trend: '+23%' },
    { icon: TrendingUp, label: 'Appointments', value: '8,921', trend: '+18%' },
  ];

  const pendingRefunds = [
    {
      id: '1',
      appointmentId: 'APT001',
      patientName: 'Amit Kumar',
      amount: 500,
      reason: 'Doctor cancellation',
      status: 'PENDING',
      requestedAt: '2 hours ago',
    },
    {
      id: '2',
      appointmentId: 'APT002',
      patientName: 'Priya Singh',
      amount: 1200,
      reason: 'No-show refund',
      status: 'APPROVED',
      requestedAt: '30 min ago',
    },
  ];

  const priceDisputes = [
    {
      id: '1',
      patientName: 'Rajesh Patel',
      doctorName: 'Dr. Sharma',
      lockedFee: 2000,
      claimedFee: 1500,
      evidence: 'Screenshot of quoted price',
      status: 'PENDING',
    },
    {
      id: '2',
      patientName: 'Neha Verma',
      doctorName: 'Dr. Patel',
      lockedFee: 1000,
      claimedFee: 800,
      evidence: 'Website screenshot',
      status: 'RESOLVED',
    },
  ];

  const systemMetrics = [
    { label: 'API Health', value: '99.8%', status: 'healthy' },
    { label: 'Queue Processing', value: '0.2s', status: 'healthy' },
    { label: 'DB Response Time', value: '12ms', status: 'healthy' },
    { label: 'Cache Hit Rate', value: '94%', status: 'healthy' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform analytics, refund management, and system health</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {dashboardStats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <stat.icon className="w-8 h-8 text-primary-600 opacity-50" />
                  <span className="text-xs font-medium text-green-600">{stat.trend}</span>
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="refunds" className="space-y-4">
          <TabsList>
            <TabsTrigger value="refunds">Refund Management</TabsTrigger>
            <TabsTrigger value="disputes">Price Disputes</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          {/* Refund Management Tab */}
          <TabsContent value="refunds" className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Refunds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRefunds.map((refund) => (
                    <div
                      key={refund.id}
                      onClick={() => setSelectedRefund(refund)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedRefund?.id === refund.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{refund.patientName}</p>
                          <p className="text-sm text-gray-600">{refund.reason}</p>
                        </div>
                        <Badge variant={refund.status === 'APPROVED' ? 'success' : 'warning'}>
                          {refund.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">{refund.requestedAt}</p>
                        <p className="font-bold text-gray-900">₹{refund.amount}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {selectedRefund && (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedRefund.patientName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 pb-4 border-b border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Appointment</span>
                      <span className="font-medium">{selectedRefund.appointmentId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-bold text-lg">₹{selectedRefund.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reason</span>
                      <span>{selectedRefund.reason}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={selectedRefund.status === 'APPROVED' ? 'success' : 'warning'}>
                        {selectedRefund.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedRefund.status === 'PENDING' && (
                    <div className="space-y-2">
                      <Button className="w-full">Approve & Process</Button>
                      <Button variant="outline" className="w-full">
                        Request More Info
                      </Button>
                      <Button variant="outline" className="w-full text-red-600">
                        Reject
                      </Button>
                    </div>
                  )}

                  {selectedRefund.status === 'APPROVED' && (
                    <Button className="w-full" disabled>
                      <CheckCircle size={18} className="mr-2" />
                      Already Processed
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Price Disputes Tab */}
          <TabsContent value="disputes" className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Price Disputes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priceDisputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      onClick={() => setSelectedDispute(dispute)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedDispute?.id === dispute.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{dispute.patientName}</p>
                          <p className="text-sm text-gray-600">vs {dispute.doctorName}</p>
                        </div>
                        <Badge
                          variant={dispute.status === 'RESOLVED' ? 'success' : 'warning'}
                        >
                          {dispute.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          ₹{dispute.claimedFee} claimed vs ₹{dispute.lockedFee} charged
                        </span>
                        <AlertTriangle size={16} className="text-yellow-600" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {selectedDispute && (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedDispute.patientName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 pb-4 border-b border-gray-200">
                    <div className="text-sm">
                      <span className="text-gray-600 block">Doctor</span>
                      <span className="font-medium">{selectedDispute.doctorName}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 block">Charged</span>
                      <span className="font-bold text-lg text-red-600">₹{selectedDispute.lockedFee}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 block">Claimed</span>
                      <span className="font-bold text-lg text-green-600">₹{selectedDispute.claimedFee}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 block">Difference</span>
                      <span className="font-bold">
                        ₹{selectedDispute.lockedFee - selectedDispute.claimedFee}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 block">Evidence</span>
                      <span>{selectedDispute.evidence}</span>
                    </div>
                  </div>

                  {selectedDispute.status === 'PENDING' && (
                    <div className="space-y-2">
                      <Button className="w-full">
                        Approve & Refund ₹{selectedDispute.lockedFee - selectedDispute.claimedFee}
                      </Button>
                      <Button variant="outline" className="w-full">
                        Deny Dispute
                      </Button>
                    </div>
                  )}

                  {selectedDispute.status === 'RESOLVED' && (
                    <Button className="w-full" disabled>
                      <CheckCircle size={18} className="mr-2" />
                      Already Resolved
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {systemMetrics.map((metric, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      <div className="mt-2 flex items-center">
                        <div className={`w-2 h-2 rounded-full ${metric.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs text-gray-600 ml-2">
                          {metric.status === 'healthy' ? 'Healthy' : 'Degraded'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
