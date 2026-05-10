import { useNavigate } from 'react-router-dom';
import { MessageSquare, Bot, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();

  // Stats de ejemplo (TODO: obtener desde API)
  const stats = [
    {
      title: 'Conversaciones Activas',
      value: '12',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Respondidas por IA',
      value: '89%',
      icon: Bot,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Clientes Únicos',
      value: '156',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Satisfacción',
      value: '94%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BrahamsBot</h1>
                <p className="text-sm text-gray-500">Sistema de Atención Automatizada</p>
              </div>
            </div>
            <Button onClick={() => navigate('/whatsapp-setup')}>
              Conectar WhatsApp
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => navigate('/whatsapp-setup')}
              >
                <MessageSquare className="w-6 h-6 mb-2" />
                <span>Configurar WhatsApp</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Bot className="w-6 h-6 mb-2" />
                <span>Personalizar IA</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <TrendingUp className="w-6 h-6 mb-2" />
                <span>Ver Analíticas</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder - TODO: cargar conversaciones reales */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 rounded-full p-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Juan Pérez</p>
                    <p className="text-sm text-gray-500">+51 999 888 777</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="text-xs text-gray-400">Hace 5 min</p>
                </div>
              </div>

              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Conecta WhatsApp para ver conversaciones en tiempo real</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/whatsapp-setup')}
                >
                  Conectar ahora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Desarrollado con ❤️ por{' '}
            <a
              href="https://brahams.store"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              BrahamsCompany
            </a>
            {' '}2026
          </p>
        </div>
      </footer>
    </div>
  );
}
