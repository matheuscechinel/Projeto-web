import { useMemo, useState } from 'react';
import {
  agruparPedidosPorEstabelecimento,
  alternarPeriodoGrafico,
  compararPrecoNoEstabelecimento,
  comporDataISO,
  formatarDiaMes,
  formatarDataBrasileira,
  obterHistoricoPrecos,
  obterSerieGraficoAnterior,
  obterDiasDaSemana,
} from '../dados/formatar_data.js';

const estabelecimentos = ['Restaurante', 'Sushi 1', 'Sushi 2'];
const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function obterDataDeHoje() {
  const hoje = new Date();
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0'),
  ].join('-');
}

function GraficoEstabelecimentos({ dados }) {
  const largura = 620;
  const alturaLinha = 44;
  const topo = 14;
  const larguraBarra = 350;
  const maximo = Math.max(1, ...dados.map((item) => item.quantidade));
  const altura = Math.max(100, topo * 2 + dados.length * alturaLinha);

  return (
    <svg
      className="grafico-barras"
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={`Quantidade de pedidos por estabelecimento: ${dados.map((item) => `${item.nome}, ${item.quantidade} pedidos`).join('; ')}`}
    >
      {dados.map((item, indice) => {
        const y = topo + indice * alturaLinha;
        const larguraItem = (item.quantidade / maximo) * larguraBarra;

        return (
          <g key={item.nome}>
            <text className="rotulo-barra" x="0" y={y + 19}>{item.nome}</text>
            <rect className="trilho-barra" x="160" y={y + 4} width={larguraBarra} height="18" rx="9" />
            <rect className="preenchimento-barra" x="160" y={y + 4} width={larguraItem} height="18" rx="9" />
            <text className="valor-barra" x={170 + larguraBarra} y={y + 19}>{item.quantidade}</text>
          </g>
        );
      })}
    </svg>
  );
}

function obterRotulosDoMes(dataISO) {
  const [ano, mes] = dataISO.split('-').map(Number);
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  return Array.from({ length: Math.ceil(diasNoMes / 7) }, (_, indice) => {
    const inicio = indice * 7 + 1;
    const fim = Math.min(inicio + 6, diasNoMes);
    const meio = Math.round((inicio + fim) / 2);

    return {
      dataISO: comporDataISO(meio, mes, ano),
      rotulo: `${String(inicio).padStart(2, '0')}–${String(fim).padStart(2, '0')}`,
    };
  });
}

function dataParaTimestamp(dataISO) {
  if (!dataISO) return 0;
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function obterDatasConsecutivas(dataFinal, quantidade) {
  const fim = dataParaTimestamp(dataFinal);

  return Array.from({ length: quantidade }, (_, indice) => {
    const data = new Date(fim - (quantidade - indice - 1) * 86400000);
    return data.toISOString().slice(0, 10);
  });
}

function obterDatasDistribuidas(inicioISO, fimISO, quantidade) {
  const inicio = dataParaTimestamp(inicioISO);
  const fim = dataParaTimestamp(fimISO);

  return Array.from({ length: quantidade }, (_, indice) => {
    const instante = inicio + ((fim - inicio) * indice) / (quantidade - 1);
    return new Date(instante).toISOString().slice(0, 10);
  });
}

const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function SeletorDataGrafico({ valor, aoAlterar }) {
  const [aberto, setAberto] = useState(false);
  const dataInicial = valor || obterDataDeHoje();
  const [ano, mes, dia] = dataInicial.split('-').map(Number);
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const anoAtual = new Date().getFullYear();
  const primeiroAno = Math.min(anoAtual, ano) - 20;
  const ultimoAno = Math.max(anoAtual, ano) + 10;
  const anos = Array.from(
    { length: ultimoAno - primeiroAno + 1 },
    (_, indice) => primeiroAno + indice,
  );

  const atualizarData = (novoDia, novoMes, novoAno) => {
    aoAlterar(comporDataISO(novoDia, novoMes, novoAno));
  };

  return (
    <div className="controle-data-grafico">
      <span>Data de referência (opcional)</span>
      <button
        className="botao-data-grafico"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
      >
        {valor ? formatarDataBrasileira(valor) : 'Sem data'} <span aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <div
          className="popover-seletor-data"
          role="dialog"
          aria-label="Escolha o dia, o mês e o ano"
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') setAberto(false);
          }}
        >
          <div className="campos-seletor-data">
            <label>Dia
              <select
                aria-label="Dia"
                value={dia}
                onChange={(evento) => atualizarData(Number(evento.target.value), mes, ano)}
              >
                {Array.from({ length: diasNoMes }, (_, indice) => indice + 1).map((numero) => (
                  <option key={numero} value={numero}>{String(numero).padStart(2, '0')}</option>
                ))}
              </select>
            </label>
            <label>Mês
              <select
                aria-label="Mês"
                value={mes}
                onChange={(evento) => atualizarData(dia, Number(evento.target.value), ano)}
              >
                {nomesMeses.map((nome, indice) => (
                  <option key={nome} value={indice + 1}>{nome}</option>
                ))}
              </select>
            </label>
            <label>Ano
              <select
                aria-label="Ano"
                value={ano}
                onChange={(evento) => atualizarData(dia, mes, Number(evento.target.value))}
              >
                {anos.map((numero) => <option key={numero} value={numero}>{numero}</option>)}
              </select>
            </label>
          </div>
          {valor && (
            <button
              className="limpar-data-grafico"
              type="button"
              aria-label="Limpar data de referência"
              onClick={() => {
                aoAlterar('');
                setAberto(false);
              }}
            >
              Limpar data
            </button>
          )}
          <button className="confirmar-data-grafico" type="button" onClick={() => setAberto(false)}>
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}

function GraficoPrecos({ dados, inicioISO, fimISO, ticks, descricaoPeriodo }) {
  const largura = 900;
  const altura = 320;
  const margem = 58;
  const precos = dados.map((item) => item.preco);
  const precoMinimo = Math.min(...precos);
  const precoMaximo = Math.max(...precos);
  const folga = Math.max((precoMaximo - precoMinimo) * 0.15, 0.3);
  const minimo = precoMinimo - folga;
  const maximo = precoMaximo + folga;
  const inicio = dataParaTimestamp(inicioISO || dados[0]?.dataISO);
  const fim = dataParaTimestamp(fimISO || dados.at(-1)?.dataISO);
  const x = (dataISO) => (fim <= inicio
    ? largura / 2
    : margem + ((dataParaTimestamp(dataISO) - inicio) / (fim - inicio)) * (largura - 2 * margem));
  const y = (valor) => margem + ((maximo - valor) / (maximo - minimo)) * (altura - 2 * margem);
  const caminho = dados.map((item, indice) => `${indice ? 'L' : 'M'} ${x(item.dataISO)} ${y(item.preco)}`).join(' ');
  const referencias = [maximo, (maximo + minimo) / 2, minimo];

  return (
    <svg className="grafico-precos" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={`Histórico de preços na ${descricaoPeriodo}`}>
      {referencias.map((valor) => (
        <g key={valor}>
          <line className="grade-grafico" x1={margem} x2={largura - margem} y1={y(valor)} y2={y(valor)} />
          <text className="rotulo-eixo" x="8" y={y(valor) + 4}>{moeda.format(valor)}</text>
        </g>
      ))}
      {dados.length > 1 && (
        <>
          <path d={`${caminho} L ${x(dados.at(-1).dataISO)} ${altura - margem} L ${x(dados[0].dataISO)} ${altura - margem} Z`} className="area-grafico" />
          <path d={caminho} className="linha-grafico" />
        </>
      )}
      {dados.map((item) => (
        <g key={item.dataISO}>
          <circle className="ponto-grafico" cx={x(item.dataISO)} cy={y(item.preco)} r="4">
            <title>{`${formatarDataBrasileira(item.dataISO)}: ${moeda.format(item.preco)}`}</title>
          </circle>
        </g>
      ))}
      {ticks.map((tick) => (
        <g key={`${tick.dataISO}-${tick.rotulo}`}>
          <text className="rotulo-eixo" textAnchor="middle" x={x(tick.dataISO)} y={altura - (tick.dataRotulo ? 39 : 22)}>{tick.rotulo}</text>
          {tick.dataRotulo && (
            <text className="rotulo-data-grafico" textAnchor="middle" x={x(tick.dataISO)} y={altura - 18}>
              {tick.dataRotulo}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Estatisticas({ pedidos = [] }) {
  const [dataReferencia, setDataReferencia] = useState('');
  const [estabelecimentoHistorico, setEstabelecimentoHistorico] = useState('Restaurante');
  const [produtoSelecionado, setProdutoSelecionado] = useState('salsicha');
  const [periodoHistorico, setPeriodoHistorico] = useState(null);
  const produtosDisponiveis = useMemo(() => {
    const produtos = new Map();
    pedidos.forEach((pedido) => {
      const valor = String(pedido.categoria || pedido.nome || '').trim();
      if (!valor) return;
      const chave = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
      if (!produtos.has(chave)) produtos.set(chave, { valor, nome: pedido.nome || valor });
    });
    return Array.from(produtos.values());
  }, [pedidos]);
  const produtoHistorico = produtosDisponiveis.some((produto) => produto.valor === produtoSelecionado)
    ? produtoSelecionado
    : produtosDisponiveis[0]?.valor ?? '';
  const nomeProdutoHistorico = produtosDisponiveis.find((produto) => produto.valor === produtoHistorico)?.nome
    ?? produtoHistorico;
  const historicoCompleto = useMemo(
    () => obterHistoricoPrecos(pedidos, produtoHistorico, estabelecimentoHistorico),
    [pedidos, produtoHistorico, estabelecimentoHistorico],
  );
  const dataGrafico = dataReferencia || historicoCompleto.at(-1)?.dataISO || obterDataDeHoje();
  const periodoGrafico = periodoHistorico;
  const diasDaSemana = useMemo(() => obterDiasDaSemana(dataGrafico), [dataGrafico]);
  const rotulosDoMes = useMemo(() => obterRotulosDoMes(dataGrafico), [dataGrafico]);
  const [anoSelecionado, mesSelecionadoNumero] = dataGrafico.split('-').map(Number);
  const primeiroDiaDoMes = `${String(anoSelecionado).padStart(4, '0')}-${String(mesSelecionadoNumero).padStart(2, '0')}-01`;
  const ultimoDiaDoMes = comporDataISO(
    new Date(Date.UTC(anoSelecionado, mesSelecionadoNumero, 0)).getUTCDate(),
    mesSelecionadoNumero,
    anoSelecionado,
  );
  const inicioGrafico = periodoGrafico === 'semana'
    ? diasDaSemana[0]?.dataISO
    : periodoGrafico === 'mes'
      ? primeiroDiaDoMes
      : dataReferencia || historicoCompleto[0]?.dataISO || dataGrafico;
  const fimGrafico = periodoGrafico === 'semana'
    ? diasDaSemana.at(-1)?.dataISO
    : periodoGrafico === 'mes'
      ? ultimoDiaDoMes
      : dataReferencia || historicoCompleto.at(-1)?.dataISO || dataGrafico;
  const valoresHistoricos = useMemo(() => {
    if (periodoGrafico === 'semana') {
      return obterHistoricoPrecos(pedidos, produtoHistorico, estabelecimentoHistorico, inicioGrafico, fimGrafico);
    }
    if (periodoGrafico === 'mes') {
      return obterHistoricoPrecos(pedidos, produtoHistorico, estabelecimentoHistorico, inicioGrafico, fimGrafico);
    }
    if (dataReferencia) {
      return obterHistoricoPrecos(pedidos, produtoHistorico, estabelecimentoHistorico, dataReferencia, dataReferencia);
    }
    return historicoCompleto;
  }, [
    pedidos,
    produtoHistorico,
    estabelecimentoHistorico,
    periodoGrafico,
    inicioGrafico,
    fimGrafico,
    dataReferencia,
    historicoCompleto,
  ]);
  const comparacaoPreco = useMemo(
    () => compararPrecoNoEstabelecimento(pedidos, produtoHistorico, estabelecimentoHistorico),
    [pedidos, produtoHistorico, estabelecimentoHistorico],
  );
  const datasSerieAnterior = useMemo(() => {
    if (periodoGrafico === 'semana') return diasDaSemana.map((dia) => dia.dataISO);
    if (periodoGrafico === 'mes') return obterDatasDistribuidas(primeiroDiaDoMes, ultimoDiaDoMes, 12);

    return obterDatasConsecutivas(dataGrafico, 12);
  }, [periodoGrafico, diasDaSemana, primeiroDiaDoMes, ultimoDiaDoMes, dataGrafico]);
  const usaSerieAnterior = valoresHistoricos.length < 2;
  const valoresGrafico = usaSerieAnterior
    ? obterSerieGraficoAnterior(
      produtoHistorico,
      datasSerieAnterior,
      historicoCompleto.at(-1)?.preco ?? comparacaoPreco.preco,
    )
    : valoresHistoricos;
  const inicioGraficoExibido = usaSerieAnterior ? datasSerieAnterior[0] : inicioGrafico;
  const fimGraficoExibido = usaSerieAnterior ? datasSerieAnterior.at(-1) : fimGrafico;
  const mesSelecionado = useMemo(() => {
    const data = new Date(`${dataGrafico}T00:00:00Z`);
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(data);
  }, [dataGrafico]);
  const resumoPorEstabelecimento = useMemo(
    () => agruparPedidosPorEstabelecimento(pedidos),
    [pedidos],
  );
  const ticksGrafico = useMemo(() => {
    if (periodoGrafico === 'semana') {
      return diasDaSemana.map((dia) => ({
        dataISO: dia.dataISO,
        rotulo: dia.rotulo,
        dataRotulo: formatarDiaMes(dia.dataISO),
      }));
    }
    if (periodoGrafico === 'mes') return rotulosDoMes;
    const intervalo = Math.max(1, Math.ceil(valoresGrafico.length / 6));
    return valoresGrafico
      .filter((_, indice) => indice % intervalo === 0 || indice === valoresGrafico.length - 1)
      .map((item) => ({ dataISO: item.dataISO, rotulo: formatarDiaMes(item.dataISO) }));
  }, [periodoGrafico, diasDaSemana, rotulosDoMes, valoresGrafico]);
  const descricaoPeriodo = periodoGrafico === 'semana'
    ? `semana de ${formatarDataBrasileira(diasDaSemana[0]?.dataISO)} a ${formatarDataBrasileira(diasDaSemana.at(-1)?.dataISO)}`
    : periodoGrafico === 'mes'
      ? mesSelecionado
      : dataReferencia
        ? `histórico recente até ${formatarDataBrasileira(dataReferencia)}`
        : usaSerieAnterior ? 'histórico recente' : 'todo o histórico disponível';

  return (
    <section className="pagina estatisticas">
      <header className="cabecalho-pagina">
        <div>
          <p className="sobretitulo">ESTATÍSTICAS</p>
          <h1>Análise de Compras</h1>
          <p>Acompanhe pedidos e distribuição por estabelecimento.</p>
        </div>
      </header>

      <div className="grade-graficos">
        <section className="painel-grafico painel-precos">
          <header>
            <div>
              <h2>Comparação de preços — {nomeProdutoHistorico} · {estabelecimentoHistorico}</h2>
            </div>
          </header>
          <div className="controles-linha-grafico">
            <label>Estabelecimento
              <select value={estabelecimentoHistorico} onChange={(evento) => setEstabelecimentoHistorico(evento.target.value)}>
                {estabelecimentos.map((nome) => <option key={nome}>{nome}</option>)}
              </select>
            </label>
            <label>Produto
              <select value={produtoHistorico} onChange={(evento) => setProdutoSelecionado(evento.target.value)} disabled={produtosDisponiveis.length === 0}>
                {produtosDisponiveis.map((produto) => <option key={produto.valor} value={produto.valor}>{produto.nome}</option>)}
              </select>
            </label>
            <SeletorDataGrafico valor={dataReferencia} aoAlterar={setDataReferencia} />
            <div className="botoes-periodo-grafico" aria-label="Período do gráfico">
              <button
                type="button"
                className={periodoHistorico === 'semana' ? 'ativo' : ''}
                aria-pressed={periodoHistorico === 'semana'}
                onClick={() => setPeriodoHistorico((atual) => alternarPeriodoGrafico(atual, 'semana'))}
              >
                Semana
              </button>
              <button
                type="button"
                className={periodoHistorico === 'mes' ? 'ativo' : ''}
                aria-pressed={periodoHistorico === 'mes'}
                onClick={() => setPeriodoHistorico((atual) => alternarPeriodoGrafico(atual, 'mes'))}
              >
                Mês
              </button>
            </div>
          </div>
          <p className="periodo-grafico-atual" aria-live="polite">
            {descricaoPeriodo}
          </p>
          <p className={`variacao-preco ${comparacaoPreco.status}`} aria-live="polite">
            {comparacaoPreco.preco !== undefined && `${moeda.format(comparacaoPreco.preco)} · `}
            {comparacaoPreco.texto}
          </p>
          {valoresGrafico.length > 0 ? (
            <GraficoPrecos
              dados={valoresGrafico}
              inicioISO={inicioGraficoExibido}
              fimISO={fimGraficoExibido}
              ticks={ticksGrafico}
              descricaoPeriodo={descricaoPeriodo}
            />
          ) : (
            <p className="sem-historico-precos" role="status">
              Nenhum preço registrado para este produto e estabelecimento no período selecionado.
            </p>
          )}
        </section>

        <section className="painel-grafico painel-estabelecimentos">
          <header>
            <div>
              <h2>Pedidos por estabelecimento</h2>
              <p>Todos os pedidos cadastrados, agrupados por local.</p>
            </div>
          </header>
          <GraficoEstabelecimentos dados={resumoPorEstabelecimento} />
        </section>
      </div>
    </section>
  );
}
