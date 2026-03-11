import { useState, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
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
  const [filteredData, setFilteredData] = useState([]);
  const [tipoGrafico, setTipoGrafico] = useState('line');

  const metricas = {
    tensao: { name: 'Tensão', unit: 'V', color: '#00ff88' },
    corrente: { name: 'Corrente', unit: 'A', color: '#ff7300' },
    potencia: { name: 'Potência', unit: 'W', color: '#2afcfc' }
  };

  const currentMetrica = metricas[metrica];

  const dataToUse = isFiltered ? filteredData : dados;

  
  const handleFiltrar = () => {
    if (!dataInicio || !dataFim) {
      alert("Selecione as duas datas para filtrar.");
      return;
    }

    // Converte as datas selecionadas nos inputs para milissegundos
    const inicioMS = new Date(dataInicio).getTime();
    const fimMS = new Date(dataFim).getTime();

    const filtrados = dados.filter(d => {
      // Converte a data que veio do banco (Django) para milissegundos
      const leituraMS = new Date(d.timestamp).getTime();
      return leituraMS >= inicioMS && leituraMS <= fimMS;
    });

    if (filtrados.length === 0) {
      alert("Nenhum dado encontrado para este período.");
      return;
    }

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
    setZoomTempo(prev => Math.min(10, prev * 1.5));
  };

  const handleZoomOut = () => {
    setZoomFactor(prev => Math.min(10, prev * 1.2));
    setZoomTempo(prev => Math.max(1, prev * 0.7));
  };

  const handleResetZoom = () => {
    setZoomFactor(1);
    setZoomTempo(1);
  };

  // Calcular min e max para o domain
  const values = dataToUse.map(d => d[metrica]).filter(v => v != null);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 100;
  // Calcula a diferença real entre o maior e menor valor
  const amplitude = (dataMax - dataMin) || 10; 

  // O zoomFactor deve reduzir a amplitude visível para "aproximar"
  // Zoom In: zoomFactor < 1 (ex: 0.5) -> Amplitude menor -> Gráfico "perto"
  // Zoom Out: zoomFactor > 1 (ex: 2.0) -> Amplitude maior -> Gráfico "longe"
  const margem = (amplitude / 2) * zoomFactor;
  const centro = (dataMax + dataMin) / 2;

  const yDomain = [
    centro - margem, 
    centro + margem
  ];

  const [zoomTempo, setZoomTempo] = useState(1); // 1 = 100% dos dados, 0.5 = 50% mais recentes
  // Pega apenas uma fatia (slice) dos dados baseada no zoom de tempo
  // Ex: se zoomTempo for 0.5, mostra apenas os 50% finais do array (os mais recentes)
  const dataFinal = dataToUse.slice(Math.floor(dataToUse.length * (1 - 1 / zoomTempo)));

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
      {tipoGrafico !== 'bar' && (
        <>
        <button onClick={handleZoomIn} style={btnStyle(false, compact)}>Zoom +</button>
        <button onClick={handleZoomOut} style={btnStyle(false, compact)}>Zoom -</button>
        <button onClick={handleResetZoom} style={btnStyle(false, compact)}>Reset Zoom</button>
        </>
      )}

       {/* CONTROLE DE TIPO DE GRÁFICO */}
      <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
        {['line', 'bar', 'area'].map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoGrafico(tipo)}
            style={{
              padding: '4px 8px',
              backgroundColor: tipoGrafico === tipo ? 'var(--primary)' : 'var(--bg-sidebar)',
              color: tipoGrafico === tipo ? 'white' : 'var(--text-main)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            {tipo.toUpperCase()}
          </button>
        ))}
      </div>
    </div>

    {/* 3. ÁREA DO GRÁFICO */}
    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
      {!hasData ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Sem dados suficientes para o gráfico
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {/* ESCOLHA DO TIPO DE GRÁFICO */}
          {tipoGrafico === 'bar' ? (
            <BarChart data={dataFinal} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tema === 'dark' ? '#444' : '#ccc'} vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(str) => new Date(str).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                minTickGap={30} stroke="#888" fontSize={10} padding={{ left: 10, right: 10 }}
                label={{ 
                  value: 'HORÁRIO', 
                  position: 'insideBottom', 
                  offset: -5, // Valor negativo pequeno para ficar logo abaixo dos números
                  style: { fill: '#888', fontSize: '10px', fontWeight: 'bold' } 
                }}
              />
              {/* No modo BARRA o domain é fixo em [0, 'auto'] */}
              <YAxis stroke="#888" 
                domain={[0, 'auto']} 
                tick={{ fontSize: 10 }} 
                width={40}
                label={{ 
                  value: `${currentMetrica.name} (${currentMetrica.unit})`, 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: -10, // Ajuste este valor até o texto aparecer ao lado dos números
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: '11px' } 
                }} 
              />
              <Tooltip contentStyle={{ backgroundColor: tema === 'dark' ? '#222' : '#fff', border: 'none', color: tema === 'dark' ? '#fff' : '#000' }} />
              <Bar dataKey={metrica} fill={currentMetrica.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : tipoGrafico === 'area' ? (
            <AreaChart data={dataFinal} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentMetrica.color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={currentMetrica.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tema === 'dark' ? '#444' : '#ccc'} vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(str) => new Date(str).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                minTickGap={30} stroke="#888" fontSize={10}
                label={{ 
                  value: 'HORÁRIO', 
                  position: 'insideBottom', 
                  offset: -5, // Valor negativo pequeno para ficar logo abaixo dos números
                  style: { fill: '#888', fontSize: '10px', fontWeight: 'bold' } 
                }}
              />
              <YAxis stroke="#888" 
                domain={yDomain} 
                tick={{ fontSize: 10 }} 
                width={40}
                label={{ 
                  value: `${currentMetrica.name} (${currentMetrica.unit})`, 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: -10, // Ajuste este valor até o texto aparecer ao lado dos números
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: '11px' } 
                }}  
              />
              <Tooltip contentStyle={{ backgroundColor: tema === 'dark' ? '#222' : '#fff', border: 'none', color: tema === 'dark' ? '#fff' : '#000' }} />
              <Area type="monotone" dataKey={metrica} stroke={currentMetrica.color} fill="url(#colorFill)" strokeWidth={2} />
            </AreaChart>
          ) : (
            /* SEU LINECHART ORIGINAL */
            <LineChart data={dataFinal} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tema === 'dark' ? '#444' : '#ccc'} vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(str) => new Date(str).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                minTickGap={30} stroke="#888" fontSize={10}
                label={{ 
                  value: 'HORÁRIO', 
                  position: 'insideBottom', 
                  offset: -5, // Valor negativo pequeno para ficar logo abaixo dos números
                  style: { fill: '#888', fontSize: '10px', fontWeight: 'bold' } 
                }}
              />
              <YAxis stroke="#888" 
                domain={yDomain} 
                tick={{ fontSize: 10 }} 
                width={40}
                label={{ 
                  value: `${currentMetrica.name} (${currentMetrica.unit})`, 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: -10, // Ajuste este valor até o texto aparecer ao lado dos números
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: '11px' } 
                }}  
              />
              <Tooltip contentStyle={{ backgroundColor: tema === 'dark' ? '#222' : '#fff', border: 'none', color: tema === 'dark' ? '#fff' : '#000' }} />
              <Line type="monotone" dataKey={metrica} stroke={currentMetrica.color} strokeWidth={2} dot={false} animationDuration={300} />
            </LineChart>
          )}
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