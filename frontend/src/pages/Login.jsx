import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  setErro(''); // Limpa erro anterior
  try {
    // 1. Ajuste o IP/Porta para o seu servidor Django (ex: porta 8000)
    const res = await axios.post('http://192.168.0.108:8000/api/token/', { 
      username, 
      password 
    });
    
    // 2. O Simple JWT usa 'access' para o token
    localStorage.setItem('token', res.data.access);
    localStorage.setItem('user_name', res.data.first_name); 
    
    // 3. O nome do usuário você pode pegar de outra rota depois ou 
    // decodificar do próprio Token (JWT)
    localStorage.setItem('user_name', username); 
    
    navigate('/'); 
  } catch (err) {
    setErro('Usuário ou senha incorretos.');
  }
};

  return (
    <div className="login-page-wrapper">
      <div className="login-header">
        <img src="/Artech.png" alt="Logo Empresa" className="login-logo-main" />
      </div>

      <div className="login-card-container">
        <div className="form-section">
          <h3>SISTEMA DE MONITORAMENTO</h3>
          <p className="subtitle">Unidade Extrema MG</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Usuário</label>
              <input 
                type="text" 
                placeholder="Digite seu usuário" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label>Senha</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            {erro && <span className="error-message">{erro}</span>}

            <button type="submit" className="btn-primary-login">
              Acessar Painel
            </button>
          </form>
        </div>
        
        <div className="image-side-panel d-none d-lg-block">
          {/* Pode deixar vazio ou colocar um gradiente tech no CSS */}
        </div>
      </div>

      <div className="footer-credits">
        <small>POWERED BY</small>
        <img src="/Artech.png" alt="Developer" className="img-dev" />
      </div>
    </div>
  );
};
