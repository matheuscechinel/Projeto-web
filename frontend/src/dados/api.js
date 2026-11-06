import { formatarDataBrasileira } from './formatar_data.js';

const URL_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

/* ---------- sessão ---------- */

let token = null;
let aoSessaoExpirar = null;

export const definirToken = (novoToken) => { token = novoToken || null; };
export const definirAoSessaoExpirar = (funcao) => { aoSessaoExpirar = funcao; };

async function requisicao(caminho, { metodo = 'GET', corpo } = {}) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${URL_BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor.', 0);
  }

  // token vencido/inválido em rota autenticada: volta para a tela de login
  if (resposta.status === 401 && token && !caminho.startsWith('/auth/')) {
    token = null;
    aoSessaoExpirar?.();
    throw new ErroApi('Sessão expirada. Entre novamente.', 401);
  }

  if (!resposta.ok) {
    let detalhe = 'Não foi possível concluir a operação.';
    try {
      const json = await resposta.json();
      detalhe = typeof json.detail === 'string' ? json.detail : 'Dados inválidos.';
    } catch { /* resposta sem corpo JSON */ }
    throw new ErroApi(detalhe, resposta.status);
  }

  return resposta.status === 204 ? null : resposta.json();
}

/* ---------- adaptadores: formato do banco -> formato que o front já usa ---------- */

// '2026-09-07' ou '2026-09-07T10:00:00' -> '07/09/2026' (sem passar por Date, evita fuso)
function paraDataBrasileira(valor) {
  const partes = String(valor ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '';
}

export function adaptarPedido(pedido) {
  const dataOferta = paraDataBrasileira(pedido.data_oferta);

  return {
    id: pedido.id,
    grupoPedido: pedido.grupo_pedido,
    nome: pedido.nome,
    categoria: pedido.categoria,
    quantidade: Number(pedido.quantidade),
    unidade: pedido.unidade,
    estabelecimento: pedido.estabelecimento,
    validade: paraDataBrasileira(pedido.validade),
    dataOferta,
    dataPedido: dataOferta,
    melhorPreco: Number(pedido.melhor_preco),
    ofertaFornecedor: pedido.oferta_fornecedor == null ? null : Number(pedido.oferta_fornecedor),
    fornecedor: pedido.fornecedor ?? '',
    avaliacao: pedido.avaliacao,
  };
}

// formulário do front (Configuracoes) -> corpo esperado pela API
function montarCorpoPedido(dados) {
  const estabelecimentos = dados.estabelecimentos?.length
    ? dados.estabelecimentos
    : [dados.estabelecimento].filter(Boolean);

  const corpo = {
    nome: String(dados.nome).trim(),
    quantidade: Number(dados.quantidade),
    unidade: dados.unidade,
    estabelecimentos,
  };

  if (dados.modoValidade === 'data' && formatarDataBrasileira(dados.validadeEscolhida)) {
    corpo.validade = dados.validadeEscolhida;
  } else {
    corpo.prazo = Number(dados.prazo) || 7;
  }

  return corpo;
}

/* ---------- pedidos e ofertas ---------- */

export async function listarPedidos() {
  return (await requisicao('/pedidos')).map(adaptarPedido);
}

export const criarPedidosNaApi = (dados) =>
  requisicao('/pedidos', { metodo: 'POST', corpo: montarCorpoPedido(dados) });

export const editarPedidoNaApi = (id, dados) =>
  requisicao(`/pedidos/${id}`, { metodo: 'PUT', corpo: montarCorpoPedido(dados) });

// o fornecedor é identificado pelo token da sessão
export const enviarOfertaNaApi = (pedidoId, preco) =>
  requisicao(`/pedidos/${pedidoId}/ofertas`, { metodo: 'POST', corpo: { preco } });

/* ---------- autenticação por código ---------- */

export const solicitarCodigo = (email) =>
  requisicao('/auth/solicitar-codigo', { metodo: 'POST', corpo: { email } });

export const verificarCodigo = (email, codigo) =>
  requisicao('/auth/verificar-codigo', { metodo: 'POST', corpo: { email, codigo } });

/* ---------- contas (fornecedores + acessos) ---------- */

const adaptarConta = (fornecedor) => ({
  id: fornecedor.id,
  nome: fornecedor.nome,
  email: fornecedor.email,
  acessos: fornecedor.acessos ?? [],
});

export async function listarFornecedores() {
  return (await requisicao('/fornecedores')).map(adaptarConta);
}

export async function salvarFornecedor({ id, nome, email, acessos }) {
  const fornecedor = id
    ? await requisicao(`/fornecedores/${id}`, { metodo: 'PUT', corpo: { nome, email } })
    : await requisicao('/fornecedores', { metodo: 'POST', corpo: { nome, email } });

  const acessosSalvos = await requisicao(`/fornecedores/${fornecedor.id}/acessos`, {
    metodo: 'PUT',
    corpo: { estabelecimentos: acessos },
  });

  return adaptarConta({ ...fornecedor, acessos: acessosSalvos });
}

export const excluirFornecedor = (id) => requisicao(`/fornecedores/${id}`, { metodo: 'DELETE' });
