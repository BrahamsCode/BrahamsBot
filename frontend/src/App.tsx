import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import WhatsAppSetup from './pages/WhatsAppSetup';
import TelegramSetup from './pages/TelegramSetup';
import Inbox from './pages/Inbox';

// Cliente de React Query para manejar cache de datos
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/whatsapp-setup" element={<WhatsAppSetup />} />
          <Route path="/telegram-setup" element={<TelegramSetup />} />
          <Route path="/inbox" element={<Inbox />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
