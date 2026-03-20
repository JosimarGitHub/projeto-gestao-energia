import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import axios from 'axios';
import html2canvas from 'html2canvas';

export const GraficoUPlot = forwardRef(({ dados, tema, metrica, cor, altura, tipoGrafico }, ref) => {
  const chartRef = useRef();
  const uInstance = useRef();

  const ts = dados.map(d => new Date(d.timestamp).getTime() / 1000);
  const xMin = Math.min(...ts);
  const xMax = Math.max(...ts);

  function drawBars(u, seriesIdx, idx0, idx1) {
    const { paths } = uPlot;
    return paths.bars({ size: [0.6, 100] })(u, seriesIdx, idx0, idx1);
  }

  // Plugin para área (o que você já tem, mas explícito)
  function drawArea(u, seriesIdx, idx0, idx1) {
      return uPlot.paths.stepped({ align: 1 })(u, seriesIdx, idx0, idx1);
  }

  useEffect(() => {
    
    if (!dados || dados.length === 0) return;

    // uPlot espera: [ [timestamps], [valores] ]
    const data = [
      dados.map(d => new Date(d.timestamp).getTime() / 1000),
      dados.map(d => d[metrica] || 0)
    ];

    const opts = {
      width: chartRef.current.offsetWidth,
      height: altura,
      cursor: {
        drag: { setScale: false, setSeries: true }, // Permite selecionar área para ZOOM
        sync: { key: "mo" },      // Sincroniza se houver mais de um gráfico
        points: { size: 10, fill: cor },
        dataIdx: (self, seriesIdx, hoveredIdx) => hoveredIdx
      },

      hooks: {
        ready: [
          (u) => {
            let dragging = false;
            let x0, xMin0, xMax0;

            u.over.addEventListener("mousedown", e => {
              dragging = true;
              x0 = e.clientX;
              xMin0 = u.scales.x.min;
              xMax0 = u.scales.x.max;

              document.addEventListener("mousemove", mousemove);
              document.addEventListener("mouseup", mouseup);
            });

            u.over.addEventListener("wheel", e => {
              e.preventDefault();

              const { min, max } = u.scales.x;
              const range = max - min;

              const factor = e.deltaY < 0 ? 0.9 : 1.1;
              const center = (min + max) / 2;

              const newRange = range * factor;

              u.setScale("x", {
                min: center - newRange / 2,
                max: center + newRange / 2
              });
            });

            const mousemove = (e) => {
              if (!dragging) return;

              const dx = e.clientX - x0;

              const factor = (xMax0 - xMin0) / u.bbox.width;

              const shift = dx * factor;

              u.setScale("x", {
                min: xMin0 - shift,
                max: xMax0 - shift,
              });
            };

            const mouseup = () => {
              dragging = false;
              document.removeEventListener("mousemove", mousemove);
              document.removeEventListener("mouseup", mouseup);
            };

             const handleTeclado = (e) => {
              const { min, max } = u.scales.x;
              const range = max - min;
              const step = range * 0.1; // Move 10% da tela por clique

              if (e.key === "ArrowLeft") {
                u.setScale("x", { min: min - step, max: max - step });
              } else if (e.key === "ArrowRight") {
                u.setScale("x", { min: min + step, max: max + step });
              } else if (e.key === "ArrowUp") {
                // Zoom In opcional via teclado
                u.setScale("x", { min: min + step, max: max - step });
              } else if (e.key === "ArrowDown") {
                // Zoom Out opcional via teclado
                u.setScale("x", { min: min - step, max: max + step });
              }
            };

            // Adiciona o evento ao documento para capturar as setas
            document.addEventListener("keydown", handleTeclado);

            // Importante: Remover o evento quando o gráfico sumir
            u.hooks.destroy = [() => {
              document.removeEventListener("keydown", handleTeclado);
            }];

          }
        ]
      },

      scales: { 
        x: { 
          time: true,  
          auto: false, 
          min: xMin,
          max: xMax,  
        }, 
        y: {
          auto: true, 
          range: (self, min, max) => {
            let span = max - min;
            if (span === 0) span = 2; // Evita divisão por zero
            return [min - span * 0.1, max + span * 0.1];
          } 
        } 
      },
      series: [
        {
          // 1. Muda o nome de "Time" para "Hora"
          label: "Hora", 
          // 2. Formata para: HH:MM - DD/MM/AA
          value: (_, val) => {
            if (val == null) return "--";
            const d = new Date(val * 1000);
            const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
            return `${hora} - ${data}`; // Aqui você define a apresentação
          },
        },
        {
          label: metrica.toUpperCase(),
          stroke: cor,
          width: tipoGrafico === 'bar' ? 0 : 2,

          fill: tipoGrafico === 'bar' 
            ? cor 
            : (tipoGrafico === 'area' ? `${cor}33` : `${cor}00`),

          filter: (self, seriesIdx, show) => null,
          paths: tipoGrafico === 'bar' ? uPlot.paths.bars({size: [0.6, 100]}) : undefined, 
          spanGaps: true,
          points: { show: tipoGrafico === 'line', size: 4 }
        },
      ],
      axes: [
        {
        // --- EIXO X (DATA E HORA) ---
        stroke: tema === 'dark' ? "#888" : "#666",
        space: 40,
        size: 30,
        grid: {
          stroke: tema === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", // Grid bem opaco
          width: 1,
        },
        // Formata para o padrão brasileiro sem segundos
        values: (self, ticks) => ticks.map(t => {
          const d = new Date(t * 1000);
          return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }),
        },
        {
          // --- EIXO Y (VALORES) ---
          stroke: tema === 'dark' ? "#888" : "#666",
          grid: {
            stroke: tema === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", // Grid bem opaco
            width: 1,
          },
          size: 50,
          // Formata o valor com 1 casa decimal e o sufixo da unidade
          values: (self, ticks) => ticks.map(t => t.toFixed(1)) 
        }
      ],
      legend: {
        show: true,
        live: true,
        values: [
          {
            // Formata o Tempo na legenda (Topo do gráfico)
            label: "Data/Hora",
            value: (self, val) => val == null ? "--" : new Date(val * 1000).toLocaleString('pt-BR', { 
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
            }),
          },
          {
            // Formata o Valor na legenda
            label: "Medição",
            value: (self, val) => val == null ? "--" : val.toFixed(2),
          }
        ]
      }
    };

    if (!uInstance.current) {
      uInstance.current = new uPlot(opts, data, chartRef.current);
    } else {
      uInstance.current.setData(data);
    }

    return () => {
      uInstance.current?.destroy();
      uInstance.current = null;
    };
  }, [dados, tema, metrica, cor, altura, tipoGrafico]);

  useEffect(() => {
    const handleResize = () => {
      if (uInstance.current && chartRef.current) {
        uInstance.current.setSize({
          width: chartRef.current.offsetWidth,
          height: altura
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [altura]);

  useImperativeHandle(ref, () => ({
      zoomBy: (factor) => {
        const u = uInstance.current;
        if (!u) return;
        const { min, max } = u.scales.x;
        const center = (min + max) / 2;
        const range = (max - min) * factor;
        u.setScale('x', { min: center - range / 2, max: center + range / 2 });
      },
      resetZoom: () => {
        const u = uInstance.current;
        if (!u) return;
        // opcional: ajustar para os extremos dos dados
        const ts = dados.map(d => new Date(d.timestamp).getTime() / 1000);
        const xMin = Math.min(...ts);
        const xMax = Math.max(...ts);
        u.setScale('x', { min: xMin, max: xMax });
      }
    }));

  return <div ref={chartRef} />;
});

export const GraficoEnergia = ({ dados, compact = false, pausado, setPausado, tema, sensorId, height: customHeight }) => {
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
  const [tipoGrafico, setTipoGrafico] = useState('area');
  const uplotRef = useRef();

  const metricas = {
    tensao: { name: 'Tensão', unit: 'V', color: '#00ff88' },
    corrente: { name: 'Corrente', unit: 'A', color: '#ff7300' },
    potencia: { name: 'Potência', unit: 'W', color: '#2afcfc' }
  };

  const currentMetrica = metricas[metrica];

  const dataToUse = isFiltered ? filteredData : dados;

  
  const handleFiltrar = async () => { // Adicione o 'async' aqui
    if (!dataInicio || !dataFim) {
      alert("Selecione as duas datas para filtrar.");
      return;
    }

    const token = localStorage.getItem('token');

    try {
      // O PULO DO GATO: Fazemos uma nova busca no BANCO DE DADOS (Django)
      // Passamos os parâmetros inicio e fim na URL
      const res = await axios.get(`/api/leituras/?sensor=${encodeURIComponent(sensorId)}&inicio=${dataInicio}&fim=${dataFim}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

      if (res.data.length === 0) {
        alert("Nenhum dado encontrado no banco para este período.");
        return;
      }

      // Ordenamos os dados que vieram do banco para o gráfico não bugar
      const dadosOrdenados = [...res.data].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      setFilteredData(dadosOrdenados);
      setIsFiltered(true); // Isso vai pausar o auto-refresh de 5s
      
    } catch (err) {
      console.error("Erro ao buscar histórico no banco:", err);
      alert("Erro ao conectar com o servidor.");
    }
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
    uplotRef.current?.zoomBy(0.9);
  };

  const handleZoomOut = () => {
     uplotRef.current?.zoomBy(1.1);
  };

  const handleResetZoom = () => {
    uplotRef.current?.resetZoom();
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

  //const [zoomTempo, setZoomTempo] = useState(1); 1 = 100% dos dados, 0.5 = 50% mais recentes
  // Pega apenas uma fatia (slice) dos dados baseada no zoom de tempo
  // Ex: se zoomTempo for 0.5, mostra apenas os 50% finais do array (os mais recentes)
  const dataFinal = dataToUse; // passe TODOS os dados para o uPlot

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

    {/* CONTAINER PAI: Garante que tudo tente ficar na mesma linha */}
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      alignItems: 'center', 
      gap: '10px', 
      marginBottom: '15px' 
    }}>
    {/* 2. CONTAINER QUE APARECE SEMPRE (HOME E DETALHE) */}
    <div style={{ 
      marginBottom: '10px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      alignItems: 'center', 
      gap: '8px' 
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
    </div>

    {/* 3. CONTAINER QUE SÓ APARECE NO DETALHE (NÃO COMPACTO) */}
    {!compact && (
      <div style={{ 
        marginBottom: '15px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        gap: '8px',
        flexShrink: 0
      }}>
        {/* INPUTS DE DATA */}
        <input
          type="datetime-local"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
        />
        <input
          type="datetime-local"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
        />

        {/* BOTÕES DE AÇÃO */}
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

        {/* BOTÃO DE PAUSE/PLAY */}
        <button 
          onClick={() => setPausado && setPausado(!pausado)}
          style={{
            padding: '8px 15px',
            backgroundColor: pausado ? '#ff4444' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {pausado ? '▶ RETOMAR' : '⏸ PAUSAR'}
        </button>

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
    )}
    </div>

    {/* 3. ÁREA DO GRÁFICO */}
    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
      {!hasData ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Sem dados suficientes para o gráfico
        </p>
      ) : (
        <div style={{ flex: 1, width: '100%', minHeight: 0, marginTop: '10px' }}>
          {!hasData ? (
            <p>Sem dados...</p>
          ) : (
            <GraficoUPlot
              ref={uplotRef}
              dados={dataFinal} 
              tema={tema} 
              metrica={metrica}
              tipoGrafico={tipoGrafico} 
              cor={currentMetrica.color} 
              altura={height - 150} // Desconta o espaço dos botões
            />
          )}
        </div>

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