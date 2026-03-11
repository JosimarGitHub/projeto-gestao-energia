import { useState, useEffect, React } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Sidebar = ({ tema, toggleTema, menuAberto, setMenuAberto }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [listaSensores, setListaSensores] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSensores = async () => {
      if (!token) return;

      try {
        const res = await axios.get('/api/sensores-lista/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setListaSensores(res.data);
      } catch (err) {
        console.error("Erro ao buscar sensores", err);
      }
    };

    fetchSensores();
  }, [token]);

  const handleLogout = () => {
    // 1. Remove o Token do localStorage (o seu @login_required vai barrar o acesso)
    localStorage.removeItem('token');
    
    // 2. Redireciona para a tela de login
    navigate('/login');
  };
  const nomeUsuario = localStorage.getItem('user_name') || 'Usuário';

  return (
    <>
      {menuAberto && <div className="overlay" onClick={() => setMenuAberto(false)}></div>}

      <aside className={`sidebar ${menuAberto ? 'aberto' : ''}`}>
        <div className="sidebar-logo">
          <img src="/Artech.png" alt="Logo" className="img-logo-sidebar" />
          <div className="sidebar-title-group">
            <h2 className="sidebar-main-title">UTILIDADES</h2>
            <small className="sidebar-sub-title">EXTREMA</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* LINK PARA MONITORAMENTO (HOME) */}
          <Link 
            to="/" 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMenuAberto(false)}
          >
            🏠 Início
          </Link>

          <h4 className="sidebar-section-title">SENSORES ATIVOS</h4>
          {listaSensores.map(id => (
          <Link 
            key={id}
            to={`/sensor/${id}`} 
            className={`nav-item ${location.pathname.includes(id) ? 'active' : ''}`}
            onClick={() => setMenuAberto(false)}
          >
            ⚡ {id.toUpperCase()}
          </Link>
        ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-tema" onClick={toggleTema} style={{ marginBottom: '10px' }}>
            {tema === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          
          {/* BOTÃO DE LOGOUT ADICIONADO AQUI */}
          <button className="btn-logout" onClick={handleLogout}>
            SAIR DO SISTEMA
          </button>

          <div className="user-info">
            <span>Bem-vindo, <strong>{nomeUsuario}</strong></span>
          </div>
        </div>
      </aside>
    </>
  );
};
