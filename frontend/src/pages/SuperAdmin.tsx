import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, MessageSquare, Users, Building2, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Conversation {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  channel: string;
  status: string;
  last_message: string;
  business_name: string;
  business_id: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  content: string;
  created_at: string;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Verificar que el usuario sea super_admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">Solo Super Administradores pueden acceder a este panel.</p>
            <Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Obtener TODAS las conversaciones
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['admin-all-conversations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/conversations/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      return data.data || [];
    },
    refetchInterval: 5000,
  });

  // Obtener mensajes de la conversación seleccionada
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['admin-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const selectedConv = conversations.find(c => c.id === selectedConversation);
      if (!selectedConv) return [];

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/api/conversations/${selectedConv.business_id}/${selectedConversation}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!selectedConversation,
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Estadísticas
  const stats = {
    totalConversations: conversations.length,
    activeConversations: conversations.filter(c => c.status === 'active').length,
    telegramConversations: conversations.filter(c => c.channel === 'telegram').length,
    whatsappConversations: conversations.filter(c => c.channel === 'whatsapp').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-2.5 shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Panel Super Admin
                </h1>
                <p className="text-sm text-gray-600">
                  Vista global de todas las conversaciones
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-gray-300 hover:border-blue-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Conversaciones</p>
                  <p className="text-white text-3xl font-bold mt-1">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Activas</p>
                  <p className="text-white text-3xl font-bold mt-1">{stats.activeConversations}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-500 to-cyan-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium">Telegram</p>
                  <p className="text-white text-3xl font-bold mt-1">{stats.telegramConversations}</p>
                </div>
                <MessageSquare className="w-12 h-12 text-cyan-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">WhatsApp</p>
                  <p className="text-white text-3xl font-bold mt-1">{stats.whatsappConversations}</p>
                </div>
                <MessageSquare className="w-12 h-12 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Lista de Conversaciones */}
          <Card className="lg:col-span-1 overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Todas las Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2">Cargando...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay conversaciones</p>
                </div>
              ) : (
                <div className="overflow-y-auto h-[calc(100vh-400px)]">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                        selectedConversation === conv.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-gray-900">
                          {conv.customer_name || conv.customer_phone}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            conv.channel === 'telegram'
                              ? 'bg-blue-100 text-blue-700'
                              : conv.channel === 'whatsapp'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {conv.channel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-600">{conv.business_name}</p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.last_message || 'Sin mensajes'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel de Mensajes */}
          <Card className="lg:col-span-2 overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600">
              <CardTitle className="text-white">
                {selectedConv ? (
                  <div>
                    <p className="font-bold">{selectedConv.customer_name || selectedConv.customer_phone}</p>
                    <p className="text-sm text-blue-100">
                      {selectedConv.business_name} · {selectedConv.channel}
                    </p>
                  </div>
                ) : (
                  'Selecciona una conversación'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!selectedConversation ? (
                <div className="flex items-center justify-center h-[calc(100vh-450px)] text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Selecciona una conversación para ver los mensajes</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto h-[calc(100vh-450px)] space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_type === 'customer'
                            ? 'bg-gray-100'
                            : msg.sender_type === 'bot'
                            ? 'bg-blue-500 text-white'
                            : 'bg-purple-500 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold opacity-75">
                            {msg.sender_type === 'customer' ? '👤 Cliente' : msg.sender_type === 'bot' ? '🤖 Bot' : '👨‍💼 Agente'}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'customer' ? 'text-gray-500' : 'text-white opacity-70'}`}>
                          {new Date(msg.created_at).toLocaleString('es-PE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
