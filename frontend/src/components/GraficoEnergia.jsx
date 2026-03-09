import { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import html2canvas from 'html2canvas';

export const GraficoEnergia = ({ dados, compact = false, tema, height: customHeight }) => {
  const [metrica, setMetrica] = useState('tensao');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const chartRef = useRef(null);
  const height = customHeight || (compact ? 450 : 600); 
  const padding = compact ? '10px 10px 30px 10px' : '20px 20px 50px 20px';
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
  <div 
    ref={chartRef} 
    style={{ 
      width: '100%', 
      height: height, 
      backgroundColor: 'var(--bg-card)', 
      padding: padding, 
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}
  >
    {/* 1. TÍTULO */}
    <h3 style={{ fontSize: titleSize, margin: '0 0 10px 0' }}>
      Monitoramento de {currentMetrica.name} ({currentMetrica.unit})
    </h3>

    {/* 2. CONTAINER DE TODOS OS BOTÕES E FILTROS */}
    <div style={{ 
      marginBottom: '15px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      alignItems: 'center', 
      gap: '8px',
      flexShrink: 0 // IMPEDE que o gráfico esmague os botões
    }}>
      {/* SELEÇÃO DE MÉTRICA */}
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
            fontSize: compact ? '0.75rem' : '0.9rem'
          }}
        >
          {metricas[key].name}
        </button>
      ))}

      {/* INPUTS DE DATA */}
      <input
        type="datetime-local"
        value={dataInicio}
        onChange={(e) => setDataInicio(e.target.value)}
        style={{ padding: compact ? '3px' : '5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
      />
      <input
        type="datetime-local"
        value={dataFim}
        onChange={(e) => setDataFim(e.target.value)}
        style={{ padding: compact ? '3px' : '5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
      />

      {/* BOTÕES DE AÇÃO (FILTRAR, LIMPAR, EXPORTAR) */}
      <button onClick={handleFiltrar} style={btnStyle(true, compact)}>Filtrar</button>
      <button onClick={handleLimpar} style={btnStyle(false, compact)}>Limpar</button>
      <button onClick={exportCSV} style={btnStyle(true, compact)}>CSV</button>
      <button onClick={exportImage} style={btnStyle(true, compact)}>Imagem</button>

      {/* CONTROLES DE ZOOM */}
      <button onClick={handleZoomIn} style={btnStyle(false, compact)}>Zoom +</button>
      <button onClick={handleZoomOut} style={btnStyle(false, compact)}>Zoom -</button>
      <button onClick={handleResetZoom} style={btnStyle(false, compact)}>Reset Zoom</button>
    </div>

    {/* 3. ÁREA DO GRÁFICO */}
    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
      {!hasData ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Sem dados suficientes para o gráfico
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataToUse} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tema === 'dark' ? '#444' : '#ccc'} vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(str) => new Date(str).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
              stroke="#888"
              fontSize={10}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis stroke="#888" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} width={40} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: tema === 'dark' ? '#222' : '#fff', 
                border: 'none',
                color: tema === 'dark' ? '#fff' : '#000',
                fontSize: '12px'
              }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              shared={false}
            />
            <Line 
              type="monotone" 
              dataKey={metrica}
              name={currentMetrica.name}
              stroke={currentMetrica.color}
              strokeWidth={2} 
              dot={hasData && dataToUse.length < 2}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

// Função auxiliar de estilo (coloque fora do componente ou no topo do arquivo)
function btnStyle(primary, compact) {
  return {
    padding: compact ? '3px 8px' : '5px 10px',
    backgroundColor: primary ? 'var(--primary)' : 'var(--bg-sidebar)',
    color: primary ? 'white' : 'var(--text-main)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: compact ? '0.75rem' : '0.85rem'
  };
}

};