export const CardsMedicao = ({ ultimaLeitura, tema }) => {
  // Se não houver dados ainda, exibe 0
  const { tensao = 0, corrente = 0, potencia = 0 } = ultimaLeitura || {};

  // Lógica de alerta visual: se tensao < 210 ou > 235, fica vermelho
  const statustensao = (tensao < 0 || tensao > 13800) ? 'alert' : 'normal';

  return (
    <div className="cards-grid">
      <div className={`card-kpi tensao ${statustensao}`}>
        <span className="card-label">TENSÃO (V)</span>
        <div className="card-value">
          {tensao.toFixed(1)}
        </div>
      </div>

      <div className="card-kpi corrente">
        <span className="card-label">CORRENTE (A)</span>
        <div className="card-value">
          {corrente.toFixed(2)}
        </div>
      </div>

      <div className="card-kpi highlight">
        <span className="card-label">POTÊNCIA (W)</span>
        <div className="card-value">
          {potencia.toFixed(0)}
        </div>
      </div>
    </div>
  );
};
