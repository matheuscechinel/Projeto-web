/*aqui fica onde o sistema de datas funciona*/

export function formatarDataBrasileira(dataISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return '';

  const [ano, mes, dia] = dataISO.split('-');
  const data = new Date(0);
  data.setUTCFullYear(Number(ano), Number(mes) - 1, Number(dia));

  if (
    data.getUTCFullYear() !== Number(ano)
    || data.getUTCMonth() !== Number(mes) - 1
    || data.getUTCDate() !== Number(dia)
  ) {
    return '';
  }

  return `${dia}/${mes}/${ano}`;
}

export function comporDataISO(dia, mes, ano) {
  const numeros = [Number(dia), Number(mes), Number(ano)];
  if (!numeros.every(Number.isInteger)) return '';

  const [diaInformado, mesInformado, anoInformado] = numeros;
  if (anoInformado < 1 || mesInformado < 1 || mesInformado > 12 || diaInformado < 1) return '';

  const maximoDia = new Date(Date.UTC(anoInformado, mesInformado, 0)).getUTCDate();
  const diaAjustado = Math.min(diaInformado, maximoDia);

  return `${String(anoInformado).padStart(4, '0')}-${String(mesInformado).padStart(2, '0')}-${String(diaAjustado).padStart(2, '0')}`;
}

export function formatarDiaMes(dataISO) {
  if (!formatarDataBrasileira(dataISO)) return '';

  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}

function normalizarDataPedido(data) {
  const valor = String(data ?? '').trim();
  const iso = valor.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso && formatarDataBrasileira(iso[1])) return iso[1];

  const brasileira = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!brasileira) return '';

  return comporDataISO(brasileira[1], brasileira[2], brasileira[3]);
}

export function obterHistoricoPrecos(pedidos, produto, estabelecimento, dataInicio, dataFim) {
  const normalizar = (valor) => String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
  const produtoNormalizado = normalizar(produto);
  const porData = new Map();

  for (const pedido of pedidos) {
    const categoria = normalizar(pedido.categoria);
    const nome = normalizar(pedido.nome);
    const dataISO = normalizarDataPedido(pedido.dataOferta || pedido.dataPedido);
    const preco = Number(pedido.melhorPreco);

    if (
      !produtoNormalizado
      || (categoria !== produtoNormalizado && nome !== produtoNormalizado)
      || pedido.estabelecimento !== estabelecimento
      || !dataISO
      || (dataInicio && dataISO < dataInicio)
      || (dataFim && dataISO > dataFim)
      || !Number.isFinite(preco)
      || preco <= 0
    ) continue;

    const precoExistente = porData.get(dataISO);
    if (precoExistente === undefined || preco < precoExistente) porData.set(dataISO, preco);
  }

  return Array.from(porData, ([dataISO, preco]) => ({ dataISO, preco }))
    .sort((a, b) => a.dataISO.localeCompare(b.dataISO));
}

const seriesGraficosAnteriores = {
  salsicha: [6.2, 6.1, 6.45, 6.18, 5.95, 5.8, 5.65, 5.72, 5.4, 5.18, 5.35, 5],
  salame: [14.8, 15.1, 14.6, 14.2, 14.5, 13.95, 14.1, 13.6, 13.2, 13.45, 13.1, 12.9],
  cebola: [4.8, 4.65, 4.9, 5.1, 4.95, 4.7, 4.45, 4.55, 4.3, 4.4, 4.15, 4.2],
};

export function obterSerieGraficoAnterior(produto, datas, precoAtual) {
  if (!Array.isArray(datas) || datas.length < 2) return [];

  const chave = String(produto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
  const serieCompleta = seriesGraficosAnteriores[chave] ?? seriesGraficosAnteriores.salsicha;
  const serie = datas.length === 7 ? serieCompleta.slice(-7) : serieCompleta;
  const escala = Number(precoAtual) > 0 ? Number(precoAtual) / serie.at(-1) : 1;

  return datas.map((dataISO, indice) => {
    const indiceSerie = Math.round((indice / (datas.length - 1)) * (serie.length - 1));

    return {
      dataISO,
      preco: Number((serie[indiceSerie] * escala).toFixed(2)),
    };
  });
}

export function alternarPeriodoGrafico(periodoAtual, periodoClicado) {
  if (!['semana', 'mes'].includes(periodoClicado)) return periodoAtual;

  return periodoAtual === periodoClicado ? null : periodoClicado;
}

export function obterDiasDaSemana(dataISO) {
  if (!formatarDataBrasileira(dataISO)) return [];

  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const inicioSemana = new Date(Date.UTC(ano, mes - 1, dia));
  const diasAteSegunda = (inicioSemana.getUTCDay() + 6) % 7;
  inicioSemana.setUTCDate(inicioSemana.getUTCDate() - diasAteSegunda);

  return Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(inicioSemana);
    data.setUTCDate(inicioSemana.getUTCDate() + indice);

    return {
      dataISO: data.toISOString().slice(0, 10),
      rotulo: new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(data).replace('.', ''),
    };
  });
}

export function agruparPedidosPorEstabelecimento(pedidos) {
  const locais = ['Restaurante', 'Sushi 1', 'Sushi 2'];

  return locais.map((nome) => {
    const itens = pedidos.filter((pedido) => pedido.estabelecimento === nome);

    return { nome, quantidade: itens.length, pedidos: itens };
  });
}

export function compararPrecoNoEstabelecimento(pedidos, produto, estabelecimento) {
  const normalizar = (valor) => String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
  const produtoNormalizado = normalizar(produto);
  const ofertas = pedidos.filter((pedido) => {
    const categoriaPedido = normalizar(pedido.categoria);
    const nomePedido = normalizar(pedido.nome);
    return (categoriaPedido === produtoNormalizado || nomePedido === produtoNormalizado)
      && Number(pedido.melhorPreco) > 0;
  });
  const ofertasDoEstabelecimento = ofertas
    .filter((pedido) => pedido.estabelecimento === estabelecimento)
    .sort((a, b) => Number(a.melhorPreco) - Number(b.melhorPreco));
  const melhorOferta = ofertasDoEstabelecimento[0];

  if (!melhorOferta) {
    return { status: 'sem-preco', texto: 'Sem preço registrado neste estabelecimento' };
  }

  const ofertasExternas = ofertas.filter(
    (pedido) => pedido.estabelecimento !== estabelecimento,
  );
  const ofertaDeComparacao = ofertasExternas.length > 0
    ? ofertasExternas.sort((a, b) => Number(a.melhorPreco) - Number(b.melhorPreco))[0]
    : ofertasDoEstabelecimento[1];

  if (!ofertaDeComparacao) {
    return {
      status: 'sem-comparacao',
      preco: Number(melhorOferta.melhorPreco),
      texto: 'Sem outra oferta cadastrada para comparar',
    };
  }

  const preco = Number(melhorOferta.melhorPreco);
  const referencia = Number(ofertaDeComparacao.melhorPreco);
  const variacao = referencia === 0 ? 0 : ((preco - referencia) / referencia) * 100;
  const status = Math.abs(variacao) < 0.05
    ? 'mesmo-preco'
    : variacao < 0 ? 'mais-barato' : 'mais-caro';
  const textoVariacao = Math.abs(variacao).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const referenciaComparacao = ofertasExternas.length > 0
    ? 'que a menor oferta em outro estabelecimento'
    : 'que outra oferta no mesmo estabelecimento';
  const texto = status === 'mesmo-preco'
    ? 'Mesmo preço da oferta comparada'
    : `${status === 'mais-barato' ? 'Mais barato' : 'Mais caro'} ${textoVariacao}% ${referenciaComparacao}`;

  return { status, preco, referencia, variacaoPercentual: variacao, texto };
}

export function filtrarPedidosEdicao(pedidos, busca, estabelecimento) {
  const normalizar = (valor) => valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
  const termo = normalizar(busca.trim());

  return pedidos.filter((pedido) => {
    const correspondeEstabelecimento =
      estabelecimento === 'todos'
      || pedido.estabelecimento === estabelecimento;
    const correspondeBusca = normalizar(pedido.nome).includes(termo);

    return correspondeEstabelecimento && correspondeBusca;
  });
}

