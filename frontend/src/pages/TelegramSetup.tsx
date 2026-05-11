import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tantml:react-query';
import { Send, CheckCircle, AlertCircle, ArrowLeft, Home, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BUSINESS_ID = '78a50948-e45b-47cc-914b-d11800138c72'; // Obtener del primer negocio

interface BotInfo {
  id: number;
  username: string;
  first_name: string;
  is_bot: boolean;
}

interface TelegramStatus {
  success: boolean;
  status: 'active' | 'inactive';
  bot?: BotInfo;
}

export default function TelegramSetup() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  // Obtener estado actual
  const { data: status, refetch } = useQuery<TelegramStatus>({
    queryKey: ['telegram-status'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/telegram/status/${BUSINESS_ID}`);
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Inicializar bot
  const initBot = useMutation({
    mutationFn: async (botToken: string) => {
      const res = await fetch(`${API_URL}/api/telegram/init/${BUSINESS_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al inicializar bot');
      }

      return res.json();
    },
    onSuccess: () => {
      setToken('');
      refetch();
    },
  });

  // Detener bot
  const stopBot = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/telegram/bot/${BUSINESS_ID}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleInitBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      initBot.mutate(token.trim());
    }
  };

  const isConnected = status?.status === 'active' && status?.bot;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-600" />
              Configurar Telegram Bot
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-gray-300 hover:border-blue-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado del Bot */}
        {isConnected ? (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                Bot Conectado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <p className="font-semibold text-lg">@{status.bot!.username}</p>
                    <p className="text-sm text-gray-600">{status.bot!.first_name}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {status.bot!.id}</p>
                  </div>
                  <Button
                    onClick={() => stopBot.mutate()}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={stopBot.isPending}
                  >
                    Desconectar
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ✅ Tu bot está activo y listo para recibir mensajes.
                    Búscalo en Telegram como <strong>@{status.bot!.username}</strong>
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/inbox')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Ver Conversaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Formulario de Token */}
            <Card className="mb-6 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Conectar Bot de Telegram
                </CardTitle>
              </CardHeader>
              <CardContent>
                {initBot.isError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Error al conectar</p>
                      <p className="text-sm text-red-600">
                        {initBot.error instanceof Error ? initBot.error.message : 'Error desconocido'}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleInitBot} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token del Bot
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Obtén tu token desde @BotFather en Telegram
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={!token.trim() || initBot.isPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {initBot.isPending ? 'Conectando...' : 'Conectar Bot'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Instrucciones */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    📚 Cómo obtener tu Token de Telegram
                  </CardTitle>
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showInstructions ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </CardHeader>
              {showInstructions && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Abre Telegram</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Busca <strong>@BotFather</strong> (el bot oficial de Telegram)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Crea un nuevo bot</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Envía el comando <code className="bg-gray-100 px-2 py-1 rounded">/newbot</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Elige nombre y username</p>
                        <p className="text-sm text-gray-600 mt-1">
                          BotFather te pedirá un nombre (ej: "Mi Cafetería Bot") y un username que termine en "bot" (ej: "micafeteriabot")
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Copia el token</p>
                        <p className="text-sm text-gray-600 mt-1">
                          BotFather te dará un token. Cópialo y pégalo arriba ⬆️
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Importante:</strong> Nunca compartas tu token públicamente. Es como una contraseña.
                        </span>
                      </p>
                    </div>

                    <a
                      href="https://core.telegram.org/bots#6-botfather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Ver documentación completa
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>
          </>
        )}

        {/* Características */}
        <Card className="mt-6 border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg">✨ Qué puedes hacer con Telegram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Respuestas automáticas con IA</p>
                  <p className="text-sm text-gray-600">Powered by Groq (Llama 3.1)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Transferencia a humano</p>
                  <p className="text-sm text-gray-600">Cuando el cliente lo pida</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Mensajes en tiempo real</p>
                  <p className="text-sm text-gray-600">Ve las conversaciones en vivo</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">100% personalizable</p>
                  <p className="text-sm text-gray-600">Configura el tono y conocimiento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
