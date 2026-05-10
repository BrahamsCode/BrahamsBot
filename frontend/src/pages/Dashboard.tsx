import { useNavigate } from 'react-router-dom';
import { MessageSquare, Bot, Users, TrendingUp, Sparkles, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();

  // Datos para gráficos
  const conversationsData = [
    { hour: '09:00', conversaciones: 12 },
    { hour: '10:00', conversaciones: 19 },
    { hour: '11:00', conversaciones: 15 },
    { hour: '12:00', conversaciones: 28 },
    { hour: '13:00', conversaciones: 22 },
    { hour: '14:00', conversaciones: 34 },
    { hour: '15:00', conversaciones: 25 },
  ];

  const responseTimeData = [
    { day: 'Lun', tiempo: 2.1 },
    { day: 'Mar', tiempo: 1.8 },
    { day: 'Mié', tiempo: 1.5 },
    { day: 'Jue', tiempo: 1.3 },
    { day: 'Vie', tiempo: 1.2 },
    { day: 'Sáb', tiempo: 1.4 },
    { day: 'Dom', tiempo: 1.6 },
  ];

  // Stats mejorados
  const stats = [
    {
      title: 'Conversaciones Hoy',
      value: '156',
      change: '+23%',
      trend: 'up',
      icon: MessageSquare,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'IA Automation',
      value: '89%',
      change: '+5%',
      trend: 'up',
      icon: Bot,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Clientes Activos',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Satisfacción',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header Mejorado */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-2.5 shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BrahamsBot
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Atención Automatizada con IA
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <Button
                onClick={() => navigate('/whatsapp-setup')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid Animado */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
                <CardContent className="pt-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Conversaciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Conversaciones por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={conversationsData}>
                    <defs>
                      <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversaciones"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorConv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráfico de Tiempo de Respuesta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Tiempo de Respuesta (seg)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tiempo"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ fill: '#a855f7', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions Mejoradas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex-col border-2 hover:border-green-500 hover:shadow-lg hover:scale-105 transition-all"
                  onClick={() => navigate('/whatsapp-setup')}
                >
                  <MessageSquare className="w-8 h-8 mb-2 text-green-600" />
                  <span className="font-semibold">Configurar WhatsApp</span>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex-col border-2 hover:border-purple-500 hover:shadow-lg hover:scale-105 transition-all">
                  <Bot className="w-8 h-8 mb-2 text-purple-600" />
                  <span className="font-semibold">Personalizar IA</span>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex-col border-2 hover:border-orange-500 hover:shadow-lg hover:scale-105 transition-all">
                  <TrendingUp className="w-8 h-8 mb-2 text-orange-600" />
                  <span className="font-semibold">Ver Analíticas</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversaciones Recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Conversaciones en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-lg font-medium mb-2">Conecta WhatsApp para empezar</p>
                <p className="text-sm mb-6">Verás todas tus conversaciones en tiempo real aquí</p>
                <Button
                  onClick={() => navigate('/whatsapp-setup')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Conectar Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer Mejorado */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-white/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Desarrollado con ❤️ por{' '}
            <a
              href="https://brahams.store"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700"
            >
              BrahamsCompany
            </a>
            {' '}© 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
