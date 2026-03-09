import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { PaginaInicial } from './pages/PaginaInicial';
import './App.css';

// 1. COMPONENTE DE PROTEÇÃO
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const LayoutPrincipal = ({tema, setTema, menuAberto, setMenuAberto }) => {
  const location = useLocation();

  return (
    <div className="layout-wrapper">
      <button className="mobile-menu-btn" onClick={() => setMenuAberto(!menuAberto)}>
        {menuAberto ? '✕' : '☰'}
      </button>

      <Sidebar 
        tema={tema} 
        toggleTema={() => setTema(tema === 'light' ? 'dark' : 'light')}
        menuAberto={menuAberto}
        setMenuAberto={setMenuAberto}
      />

      <main className="main-content">
        <Routes>
          {/* A HOME AGORA É APRESENTAÇÃO */}
          <Route path="/" element={<PaginaInicial tema={tema} />} />
          <Route path="/sensor/:sensorId" element={<PaginaInicial tema={tema} />} />
        </Routes>
      </main>
    </div>
  );
};

// 3. APP (Gerenciador de Contexto e Rotas)
function App() {
  const [tema, setTema] = useState(localStorage.getItem('tema') || 'light');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <LayoutPrincipal 
              tema={tema}
              setTema={setTema}
              menuAberto={menuAberto}
              setMenuAberto={setMenuAberto}
            />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
