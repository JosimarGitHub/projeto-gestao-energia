import { useState, useEffect } from 'react';
import axios from 'axios';
import { GraficoEnergia } from '../components/GraficoEnergia';
import { CardsMedicao } from '../components/CardsMedicao';
import { useParams } from 'react-router-dom';

export const PaginaInicial = ({ tema }) => {
  const { sensorId } = useParams();
  const [leituras, setLeituras] = useState([]);
  const [allLeituras, setAllLeituras] = useState([]);
  const [sensores, setSensores] = useState([]);
  
  const buscarDados = async () => {
    const tokenAtual = localStorage.getItem('token');

    if (!tokenAtual) {
      console.error("Sem token no localStorage");
      return;
    }

    try {
      if (sensorId) {
        const res = await axios.get(`http://192.168.0.108:8000/api/leituras/?sensor=${encodeURIComponent(sensorId)}`, {
          headers: { 'Authorization': `Bearer ${tokenAtual}` }
        });
        setLeituras(res.data.reverse());
      } else {
        // Buscar lista de sensores
        const sensoresRes = await axios.get('http://192.168.0.108:8000/api/sensores-lista/', {
          headers: { 'Authorization': `Bearer ${tokenAtual}` }
        });
        const listaSensores = sensoresRes.data;
        setSensores(listaSensores);

        // Buscar leituras para cada sensor
        const promises = listaSensores.map(sensor =>
          axios.get(`http://192.168.0.108:8000/api/leituras/?sensor=${encodeURIComponent(sensor)}`, {
            headers: { 'Authorization': `Bearer ${tokenAtual}` }
          }).then(res => res.data)
        );
        const leiturasArrays = await Promise.all(promises);
        const allLeiturasFlat = leiturasArrays.flat();
        console.log('fetched allLeituras total', allLeiturasFlat.length, allLeiturasFlat.slice(-5));
        setAllLeituras(allLeiturasFlat);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        console.error("Token expirado! Redirecionando para login...");
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      console.error("Erro ao buscar dados", err);
    }
  };

  useEffect(() => {
    buscarDados();
    const intervalo = setInterval(buscarDados, 5000);
    return () => clearInterval(intervalo);
  }, [sensorId]);

  const ultimaLeitura = leituras.length > 0 ? leituras[leituras.length - 1] : null;

  if (sensorId) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard de Energia - {sensorId?.toUpperCase()}</h1>
        
        <CardsMedicao ultimaLeitura={ultimaLeitura} tema={tema} />
      
        <div className="grafico-card">
          <GraficoEnergia dados={leituras} tema={tema} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="dashboard-container">
        <h1>Dashboard de Energia - Todos os Sensores</h1>
        
        {sensores.map(sensor => {
          const sensorLeituras = allLeituras.filter(l => l.sensor_id === sensor);
          console.log('sensor', sensor, 'leituras', sensorLeituras.length, sensorLeituras.slice(-3));
          const ultimaLeituraSensor = sensorLeituras.length > 0 ? sensorLeituras[sensorLeituras.length - 1] : null;
          
          return (
            <div key={sensor} className="sensor-section">
              <h2>{sensor.toUpperCase()}</h2>
              
              <div className="small-cards">
                <CardsMedicao ultimaLeitura={ultimaLeituraSensor} tema={tema} />
              </div>
            
              <div className="small-grafico-card">
                <GraficoEnergia dados={sensorLeituras} tema={tema} compact />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
};
