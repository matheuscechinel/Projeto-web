import { useMemo, useState } from 'react';

const dados = {
  salsicha: [6.2, 6.1, 6.45, 6.18, 5.95, 5.8, 5.65, 5.72, 5.4, 5.18, 5.35, 5],
  salame: [14.8, 15.1, 14.6, 14.2, 14.5, 13.95, 14.1, 13.6, 13.2, 13.45, 13.1, 12.9],
  cebola: [4.8, 4.65, 4.9, 5.1, 4.95, 4.7, 4.45, 4.55, 4.3, 4.4, 4.15, 4.2],
};

function GraficoPrecos({ valores, periodo }) {
  const largura = 900; 
  const altura = 300; 
  const margem = 58;
  
  const minimo = Math.min(...valores) - 0.3; 
  const maximo = Math.max(...valores) + 0.3;
  
  const x = (indice) => margem + indice * ((largura - 2 * margem) / (valores.length - 1));
  const y = (valor) => margem + ((maximo - valor) / (maximo - minimo)) * (altura - 2 * margem);
  
  const caminho = valores.map((valor, indice) => `${indice ? 'L' : 'M'} ${x(indice)} ${y(valor)}`).join(' ');
  const referencias = [maximo, (maximo + minimo) / 2, minimo];
  
  const rotulo = (indice) => periodo === 'semana' ? `Dia ${indice + 1}` : `Sem. ${Math.floor(indice / 3) + 1}`;

  return (
    <svg className="grafico-precos" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="Variação dos preços por semana">
      {referencias.map((valor) => (
        <g key={valor}>
          <line className="grade-grafico" x1={margem} x2={largura - margem} y1={y(valor)} y2={y(valor)} />
          <text className="rotulo-eixo" x="8" y={y(valor) + 4}>
            R$ {valor.toFixed(2).replace('.', ',')}
          </text>
        </g>
      ))}

      <path d={`${caminho} L ${x(valores.length - 1)} ${altura - margem} L ${x(0)} ${altura - margem} Z`} className="area-grafico" />
      <path d={caminho} className="linha-grafico" />

      {valores.map((valor, indice) => (
        <g key={indice}>
          <circle cx={x(indice)} cy={y(valor)} r="4">
            <title>{`${rotulo(indice)}: R$ ${valor.toFixed(2).replace('.', ',')}`}</title>
          </circle>
          {(periodo === 'semana' || indice % 3 === 0 || indice === valores.length - 1) && (
            <text className="rotulo-eixo" textAnchor="middle" x={x(indice)} y={altura - 20}>
              {rotulo(indice)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Estatisticas() {
  const [produto, setProduto] = useState('salsicha');
  const [data, setData] = useState('2026-09-07');
  const [periodo, setPeriodo] = useState('mes');

  const valores = useMemo(() => {
    return periodo === 'semana' ? dados[produto].slice(-7) : dados[produto];
  }, [produto, periodo]);

  const inicio = valores[0]; 
  const atual = valores.at(-1); 
  const variacao = ((atual - inicio) / inicio) * 100;

  return (
    <section className="pagina estatisticas">
      <header className="cabecalho-pagina">
        <div>
          <p className="sobretitulo">ESTATÍSTICA</p>
          <h1>Análise de Compras</h1>
          <p>Compare os preços e acompanhe as oportunidades de economia.</p>
        </div>
      </header>

      <div className="controles-estatisticas">
        <label>
          Produto
          <select value={produto} onChange={(evento) => setProduto(evento.target.value)}>
            {Object.keys(dados).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Data da análise
          <input type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
        </label>

        <div>
          <button className={periodo === 'semana' ? 'ativo' : ''} onClick={() => setPeriodo('semana')}>
            Última semana
          </button>
          <button className={periodo === 'mes' ? 'ativo' : ''} onClick={() => setPeriodo('mes')}>
            Último mês
          </button>
        </div>
      </div>

      <div className="resumo-estatisticas">
        <article>
          <span>Preço no início</span>
          <b>R$ {inicio.toFixed(2).replace('.', ',')}</b>
        </article>

        <article>
          <span>Preço atual</span>
          <b>R$ {atual.toFixed(2).replace('.', ',')}</b>
          <small className={variacao < 0 ? 'economia' : 'aumento'}>
            {variacao < 0 ? '↓ Mais barato' : '↑ Mais caro'} {Math.abs(variacao).toFixed(1).replace('.', ',')}%
          </small>
        </article>

        <article>
          <span>Melhor preço</span>
          <b>R$ {Math.min(...valores).toFixed(2).replace('.', ',')}</b>
        </article>
      </div>

      <section className="painel-grafico">
        <h2>Comparação de preços — {produto}</h2>
        <p>Histórico no período selecionado. Os eixos trazem valores por semana.</p>
        <GraficoPrecos valores={valores} periodo={periodo} />
      </section>
    </section>
  );
}