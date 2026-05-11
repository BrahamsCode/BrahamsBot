import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, User, Bot, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
const BUSINESS_ID = '78a50948-e45b-47cc-914b-d11800138c72';

interface Conversation {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  channel: string;
  status: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
}

interface Message {
  id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  content: string;
  created_at: string;
}

export default function Inbox() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  // Conectar WebSocket
  useEffect(() => {
    const socket = io(WS_URL);

    socket.on('connect', () => {
      console.log('✓ Conectado a WebSocket');
      socket.emit('join_business', BUSINESS_ID);
    });

    socket.on('new_message', (data: any) => {
      console.log('📨 Nuevo mensaje:', data);
      // Invalidar queries para refrescar
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedConversation, queryClient]);

  // Obtener conversaciones
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/conversations/${BUSINESS_ID}`);
      const data = await res.json();
      return data.data as Conversation[];
    },
    refetchInterval: 5000,
  });

  // Obtener mensajes de la conversación seleccionada
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await fetch(`${API_URL}/api/conversations/${BUSINESS_ID}/${selectedConversation}/messages`);
      const data = await res.json();
      return data.data as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Enviar mensaje
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(
        `${API_URL}/api/conversations/${BUSINESS_ID}/${selectedConversation}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, agentId: 'human' }),
        }
      );
      return res.json();
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessage.mutate(messageText);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Inbox - Conversaciones en Vivo
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Lista de Conversaciones */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-lg">
                Conversaciones ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-center text-gray-500">Cargando...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay conversaciones</p>
                  <p className="text-sm mt-1">Las conversaciones aparecerán aquí</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedConversation === conv.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {conv.customer_name || 'Cliente'}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {conv.channel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.last_message || 'Sin mensajes'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(conv.updated_at)}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConv.customer_name || 'Cliente'}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{selectedConv.customer_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        selectedConv.status === 'active' ? 'bg-green-100 text-green-700' :
                        selectedConv.status === 'transferred' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedConv.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[70%] ${
                          msg.sender_type === 'customer'
                            ? 'bg-white border border-gray-200'
                            : msg.sender_type === 'bot'
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                        } rounded-lg p-3 shadow-sm`}>
                          <div className="flex items-center gap-2 mb-1">
                            {msg.sender_type === 'customer' && <User className="w-4 h-4 text-gray-500" />}
                            {msg.sender_type === 'bot' && <Bot className="w-4 h-4" />}
                            {msg.sender_type === 'agent' && <CheckCircle className="w-4 h-4" />}
                            <span className="text-xs font-semibold">
                              {msg.sender_type === 'customer' ? 'Cliente' :
                               msg.sender_type === 'bot' ? 'Bot IA' : 'Tú'}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'customer' ? 'text-gray-400' : 'text-white/70'
                          }`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <div className="border-t p-4 bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessage.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Selecciona una conversación</p>
                  <p className="text-sm">para empezar a chatear</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
