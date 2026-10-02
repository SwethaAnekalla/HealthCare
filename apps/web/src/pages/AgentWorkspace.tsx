import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { MessageCircle, Clock, CheckCircle, AlertCircle, ThumbsUp } from 'lucide-react';

const AgentWorkspace = () => {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [tickets] = useState([
    {
      id: '1',
      userId: 'patient1',
      userName: 'Amit Kumar',
      status: 'WITH_AGENT',
      priority: 'HIGH',
      category: 'REFUND',
      lastMessage: 'When will my refund be processed?',
      createdAt: '2 hours ago',
    },
    {
      id: '2',
      userId: 'patient2',
      userName: 'Priya Singh',
      status: 'WAITING_FOR_AGENT',
      priority: 'MEDIUM',
      category: 'APPOINTMENT',
      lastMessage: 'Can I reschedule my appointment?',
      createdAt: '30 min ago',
    },
    {
      id: '3',
      userId: 'patient3',
      userName: 'Rajesh Patel',
      status: 'RESOLVED',
      priority: 'LOW',
      category: 'TECHNICAL',
      lastMessage: 'Thank you for your help!',
      createdAt: '1 hour ago',
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'success';
      case 'WITH_AGENT':
        return 'warning';
      case 'WAITING_FOR_AGENT':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Agent Workspace</h1>
          <p className="text-gray-600">Manage customer support tickets and escalations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: MessageCircle, label: 'Total Tickets', value: tickets.length, color: 'primary' },
            { icon: Clock, label: 'Waiting', value: tickets.filter((t) => t.status === 'WAITING_FOR_AGENT').length, color: 'warning' },
            { icon: CheckCircle, label: 'Resolved', value: tickets.filter((t) => t.status === 'RESOLVED').length, color: 'success' },
            { icon: ThumbsUp, label: 'Avg Rating', value: '4.8/5', color: 'primary' },
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

        <div className="grid grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="waiting">Waiting</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedTicket?.id === ticket.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{ticket.userName}</p>
                            <p className="text-sm text-gray-600">{ticket.category}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant={getStatusColor(ticket.status)}>
                              {ticket.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{ticket.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-2">{ticket.createdAt}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Details & Chat */}
          {selectedTicket ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">{selectedTicket.userName}</CardTitle>
                <p className="text-sm text-gray-600">{selectedTicket.category}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ticket Info */}
                <div className="space-y-2 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <Badge variant={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Priority</span>
                    <Badge variant={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span>{selectedTicket.createdAt}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full text-sm">
                    View Full Chat
                  </Button>
                  <Button variant="outline" className="w-full text-sm">
                    Send Canned Response
                  </Button>
                  {selectedTicket.status !== 'RESOLVED' && (
                    <Button className="w-full text-sm">
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentWorkspace;
