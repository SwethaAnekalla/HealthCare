import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

export const SupportChatWidget = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createTicket = async () => {
    try {
      const response = await apiClient.post('/support/tickets', {
        category: 'OTHER',
      });
      const { ticketId, conversationId } = response.data.data;
      setTicketId(ticketId);
      setConversationId(conversationId);

      // Add welcome message
      setMessages([
        {
          id: '1',
          message: 'Hello! How can we help you today?',
          senderType: 'BOT',
          senderName: 'Support Bot',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to create ticket', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        message: userMessage,
        senderType: 'USER',
        senderName: user?.name || 'You',
        createdAt: new Date().toISOString(),
      },
    ]);

    setLoading(true);

    try {
      // Send user message
      await apiClient.post('/support/messages', {
        conversationId,
        message: userMessage,
      });

      // Check if escalation needed
      if (
        userMessage.toLowerCase().includes('escalate') ||
        userMessage.toLowerCase().includes('human') ||
        userMessage.toLowerCase().includes('agent')
      ) {
        await apiClient.post(`/support/tickets/${conversationId}/escalate`, {});

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            message: 'Your request has been escalated to a human agent. A representative will be with you shortly.',
            senderType: 'BOT',
            senderName: 'Support Bot',
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        // Simulate bot response
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              message: 'Thank you for your message. An agent will respond shortly.',
              senderType: 'BOT',
              senderName: 'Support Bot',
              createdAt: new Date().toISOString(),
            },
          ]);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => {
            setIsOpen(true);
            if (!conversationId) {
              createTicket();
            }
          }}
          className="bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 max-w-full bg-white rounded-lg shadow-2xl flex flex-col h-96">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Support Center</h3>
          <p className="text-xs text-primary-100">We're here to help</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-700 p-1 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Starting chat...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.senderType === 'USER'
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            disabled={loading || !conversationId}
            className="flex-1 h-9"
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={loading || !input.trim() || !conversationId}
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Type "escalate" to talk to a human agent
        </p>
      </div>
    </div>
  );
};
