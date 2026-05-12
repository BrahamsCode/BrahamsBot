import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, CheckCircle2, Loader2, AlertCircle, LogOut, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import BusinessSelector from '../components/BusinessSelector';
import { whatsappApi } from '../services/api';

export default function WhatsAppSetup() {
  const navigate = useNavigate();
  const { logout, currentBusiness } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const businessId = currentBusiness?.id;

  // Verificar estado al montar
  useEffect(() => {
    checkStatus();
  }, []);

  // Polling para actualizar QR y estado
  useEffect(() => {
    if (status === 'connecting') {
      const interval = setInterval(() => {
        checkQRCode();
        checkStatus();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const checkStatus = async () => {
    try {
      const response = await whatsappApi.getStatus(businessId);
      if (response.success && response.data) {
        setStatus(response.data.status);
      }
    } catch (err) {
      console.error('Error al verificar estado:', err);
    }
  };

  const checkQRCode = async () => {
    try {
      const response = await whatsappApi.getQRCode(businessId);
      if (response.success && response.data) {
        setQrCode(response.data.qrCode);
      }
    } catch (err) {
      // No hay QR disponible, está bien
    }
  };

  const handleInitSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await whatsappApi.initSession(businessId);

      if (response.success) {
        if (response.data?.qrCode) {
          setQrCode(response.data.qrCode);
          setStatus('connecting');
        } else {
          setStatus('connected');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al conectar con WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await whatsappApi.closeSession(businessId);
      setStatus('disconnected');
      setQrCode(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al desconectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración de WhatsApp</h1>
              <p className="text-sm text-gray-500 mt-1">
                Conecta tu cuenta de WhatsApp para empezar a recibir mensajes
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <BusinessSelector />
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Estado Actual */}
            <div className="mb-6">
              {status === 'disconnected' && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>Desconectado</span>
                </div>
              )}
              {status === 'connecting' && (
                <div className="flex items-center space-x-3 text-yellow-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Esperando escaneo del código QR...</span>
                </div>
              )}
              {status === 'connected' && (
                <div className="flex items-center space-x-3 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">¡Conectado exitosamente!</span>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* QR Code */}
            {status === 'connecting' && qrCode && (
              <div className="mb-6">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
                  <img
                    src={qrCode}
                    alt="QR Code de WhatsApp"
                    className="mx-auto mb-4 w-64 h-64"
                  />
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Smartphone className="w-4 h-4" />
                    <span>Escanea este código con WhatsApp</span>
                  </div>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            {status === 'disconnected' && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Cómo conectar:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Haz clic en "Conectar WhatsApp"</li>
                  <li>Abre WhatsApp en tu teléfono</li>
                  <li>Toca Menú (⋮) → Dispositivos vinculados</li>
                  <li>Toca "Vincular un dispositivo"</li>
                  <li>Escanea el código QR que aparecerá aquí</li>
                </ol>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex space-x-3">
              {status === 'disconnected' && (
                <Button
                  onClick={handleInitSession}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Conectar WhatsApp
                    </>
                  )}
                </Button>
              )}

              {status === 'connecting' && (
                <Button
                  variant="secondary"
                  onClick={checkQRCode}
                  disabled={loading}
                  className="flex-1"
                >
                  Actualizar QR
                </Button>
              )}

              {status === 'connected' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Ir al Dashboard
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDisconnect}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Desconectar'
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Adicional */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>La sesión se mantiene activa incluso si cierras el navegador</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Los mensajes se responden automáticamente con IA</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Puedes transferir conversaciones a un agente humano cuando sea necesario</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Todas las conversaciones se guardan en tu base de datos</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
