import { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import html2canvas from 'html2canvas';

export const GraficoEnergia = ({ dados, compact = false, tema }) => {
  const [metrica, setMetrica] = useState('tensao');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const chartRef = useRef(null);
  const height = compact ? 300 : 600;
  const padding = compact ? '15px 15px 50px 15px' : '20px 20px 50px 20px';
  const titleSize = compact ? '1.1rem' : '1.25rem';
  const hasData = Array.isArray(dados) && dados.length > 0;

  const metricas = {
    tensao: { name: 'Tensão', unit: 'V', color: '#00ff88' },
    corrente: { name: 'Corrente', unit: 'A', color: '#ff7300' },
    potencia: { name: 'Potência', unit: 'W', color: '#2afcfc' }
  };

  const currentMetrica = metricas[metrica];

  const dataToUse = isFiltered ? filteredData : dados;

  const handleFiltrar = () => {
    if (!dataInicio || !dataFim) return;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const filtrados = dados.filter(d => {
      const ts = new Date(d.timestamp);
      return ts >= inicio && ts <= fim;
    });
    setFilteredData(filtrados);
    setIsFiltered(true);
  };

  const handleLimpar = () => {
    setDataInicio('');
    setDataFim('');
    setIsFiltered(false);
    setFilteredData([]);
    setZoomFactor(1);
  };

  const exportCSV = () => {
    const csv = 'timestamp,tensao,corrente,potencia\n' + dataToUse.map(d => `${d.timestamp},${d.tensao},${d.corrente},${d.potencia}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dados_${currentMetrica.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportImage = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current);
        const link = document.createElement('a');
        link.download = `grafico_${currentMetrica.name}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Erro ao exportar imagem:', error);
        alert('Erro ao exportar imagem.');
      }
    }
  };

  const handleZoomIn = () => {
    setZoomFactor(prev => Math.max(0.1, prev * 0.8));
  };

  const handleZoomOut = () => {
    setZoomFactor(prev => Math.min(10, prev * 1.2));
  };

  const handleResetZoom = () => {
    setZoomFactor(1);
  };

  // Calcular min e max para o domain
  const values = dataToUse.map(d => d[metrica]).filter(v => v != null);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 100;
  const yDomain = [dataMin - (dataMax - dataMin) * (zoomFactor - 1) / 2, dataMax + (dataMax - dataMin) * (zoomFactor - 1) / 2];


  return (
    <div ref={chartRef} style={{ width: '100%', height, backgroundColor: 'var(--bg-card)', padding, borderRadius: '8px' }}>
      <h3 style={{ fontSize: titleSize }}>Monitoramento de {currentMetrica.name} ({currentMetrica.unit})</h3>
      <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        {Object.keys(metricas).map(key => (
          <button
            key={key}
            onClick={() => setMetrica(key)}
            style={{
              padding: compact ? '3px 8px' : '5px 10px',
              backgroundColor: metrica === key ? 'var(--primary)' : 'var(--bg-sidebar)',
              color: metrica === key ? 'white' : 'var(--text-main)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: compact ? '0.8rem' : '1rem'
            }}
          >
            {metricas[key].name}
          </button>
        ))}
        <input
          type="datetime-local"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          style={{ padding: compact ? '3px' : '5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: compact ? '0.8rem' : '1rem' }}
        />
        <input
          type="datetime-local"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          style={{ padding: compact ? '3px' : '5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: compact ? '0.8rem' : '1rem' }}
        />
        <button
          onClick={handleFiltrar}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Filtrar
        </button>
        <button
          onClick={handleLimpar}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-main)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Limpar
        </button>
        <button
          onClick={exportCSV}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Exportar CSV
        </button>
        <button
          onClick={exportImage}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Exportar Imagem
        </button>
        <button
          onClick={handleZoomIn}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-main)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Zoom +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-main)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Zoom -
        </button>
        <button
          onClick={handleResetZoom}
          style={{
            padding: compact ? '3px 8px' : '5px 10px',
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-main)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '1rem'
          }}
        >
          Reset Zoom
        </button>
      </div>
      {!hasData ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Sem dados suficientes para o gráfico
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="85%"> {/* Ajustei a altura para dar respiro aos botões */}
          <LineChart 
            data={dataToUse} 
            margin={{ top: 10, right: 30, left: 40, bottom: 30 }} // Aumentei as margens
          >
            <CartesianGrid strokeDasharray="3 3" stroke={tema === 'dark' ? '#444' : '#ccc'} vertical={false} />
            
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(str) => new Date(str).toLocaleTimeString()} 
              stroke="#888"
              dy={10} // Afasta os horários para baixo
              label={{ 
                value: 'HORÁRIO', 
                position: 'insideBottom', 
                offset: -20, // Posiciona o título abaixo dos horários
                style: { fill: '#888', fontSize: '10px', fontWeight: 'bold' } 
              }}
            />

            <YAxis 
              stroke="#888" 
              domain={yDomain}
              tick={{ fontSize: 12 }}
              dx={-5} // Afasta os números da linha do eixo
              label={{ 
                value: `${currentMetrica.name} (${currentMetrica.unit})`, 
                angle: -90, 
                position: 'insideLeft', 
                offset: -30, // EMPURRA O TÍTULO PARA FORA DOS NÚMEROS
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: '12px' } 
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: tema === 'dark' ? '#222' : '#fff', 
                border: 'none',
                color: tema === 'dark' ? '#fff' : '#000'
              }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            {/*<Legend />*/}
            <Line 
              type="monotone" 
              dataKey={metrica}
              name={currentMetrica.name}
              stroke={currentMetrica.color}
              strokeWidth={2} 
              dot={hasData && dataToUse.length < 2} // show dot if only one point
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
