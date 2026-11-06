import { useCallback, useEffect, useState } from 'react';
import { formatarDataBrasileira } from '../dados/formatar_data.js';
import {
  criarPedidosNaApi,
  editarPedidoNaApi,
  enviarOfertaNaApi,
  listarPedidos,
} from '../dados/api.js';

function obterValidade(dados, dataAtual) {
  if (dados.modoValidade === 'data') return formatarDataBrasileira(dados.validadeEscolhida);

  const validade = new Date(dataAtual);
  validade.setDate(validade.getDate() + Number(dados.prazo || 7));
  return validade.toLocaleDateString('pt-BR');
}

export function criarNovosPedidos(lista, dados, dataAtual, grupoPedido) {
  const validade = obterValidade(dados, dataAtual);

  const destinos = dados.estabelecimentos?.length
    ? dados.estabelecimentos
    : [dados.estabelecimento];

  const novosPedidos = destinos.map((estabelecimento, indice) => ({
    id: grupoPedido + indice,
    grupoPedido,
    nome: dados.nome,
    categoria: dados.nome.toLowerCase(),
    quantidade: Number(dados.quantidade),
    unidade: dados.unidade.toLowerCase(),
    melhorPreco: 0,
    ofertaFornecedor: null,
    fornecedor: '',
    dataOferta: new Date(dataAtual).toLocaleDateString('pt-BR'),
    dataPedido: new Date(dataAtual).toLocaleDateString('pt-BR'),
    validade,
    estabelecimento,
    avaliacao: 'Novo',
  }));

  return [...lista, ...novosPedidos];
}

export function atualizarOfertaPedido(lista, id, preco, usuario, dataOferta) {
  return lista.map((pedido) =>
    pedido.id === id
      ? {
          ...pedido,
          melhorPreco: pedido.melhorPreco
            ? Math.min(pedido.melhorPreco, preco)
            : preco,
          ofertaFornecedor: preco,
          fornecedor: usuario.empresa || usuario.nome || 'Fornecedor',
          dataOferta: dataOferta.toLocaleDateString('pt-BR'),
        }
      : pedido,
  );
}

export function editarGrupoPedidos(lista, id, dados, dataAtual, idBase = Date.now()) {
  const validade = obterValidade(dados, dataAtual);

  const pedidoOriginal = lista.find((pedido) => pedido.id === id);
  if (!pedidoOriginal) return lista;

  const grupoPedido = pedidoOriginal.grupoPedido ?? pedidoOriginal.id;
  const destinos = dados.estabelecimentos?.length
    ? dados.estabelecimentos
    : [dados.estabelecimento];
  const pedidosNaoRelacionados = lista.filter(
    (pedido) => (pedido.grupoPedido ?? pedido.id) !== grupoPedido,
  );
  const pedidosAtualizados = destinos.map((destino, indice) => ({
    ...pedidoOriginal,
    ...dados,
    id: indice === 0 ? id : idBase + indice,
    grupoPedido,
    categoria: dados.nome.toLowerCase(),
    quantidade: Number(dados.quantidade),
    estabelecimento: destino,
    validade,
  }));

  return [...pedidosNaoRelacionados, ...pedidosAtualizados];
}

const INTERVALO_ATUALIZACAO_MS = 15000;

export function usePedidos(usuario) {
  const [pedidos, setPedidos] = useState([]);
  const logado = Boolean(usuario);

  const carregar = useCallback(async () => {
    try {
      setPedidos(await listarPedidos());
    } catch (erro) {
      console.error(erro);
    }
  }, []);

  // carrega ao entrar e atualiza de tempos em tempos (admin e fornecedores usam navegadores diferentes)
  useEffect(() => {
    if (!logado) {
      setPedidos([]);
      return undefined;
    }

    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [logado, carregar]);

  const executar = async (acao) => {
    try {
      await acao();
      await carregar();
    } catch (erro) {
      window.alert(erro.message);
    }
  };

  const criarPedido = (dados) => executar(() => criarPedidosNaApi(dados));

  const enviarOferta = (id, preco) => executar(() => enviarOfertaNaApi(id, preco));

  const editarPedido = (id, dados) => executar(() => editarPedidoNaApi(id, dados));

  return { pedidos, criarPedido, enviarOferta, editarPedido };
}
