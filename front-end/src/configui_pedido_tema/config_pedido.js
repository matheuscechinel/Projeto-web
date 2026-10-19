import { useState } from 'react';
import { pedidosIniciais } from '../dados/pedidosIniciais.js';

export function criarNovosPedidos(lista, dados, dataAtual, grupoPedido) {
  const validade = new Date(dataAtual);
  validade.setDate(validade.getDate() + Number(dados.prazo));

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
    validade: validade.toLocaleDateString('pt-BR'),
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
  const validade = new Date(dataAtual);
  validade.setDate(validade.getDate() + Number(dados.prazo));

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
    validade: validade.toLocaleDateString('pt-BR'),
  }));

  return [...pedidosNaoRelacionados, ...pedidosAtualizados];
}

export function usePedidos(usuario) {
  const [pedidos, setPedidos] = useState(pedidosIniciais);

  const criarPedido = (dados) => {
    const dataAtual = new Date();
    const grupoPedido = Date.now();
    setPedidos((lista) => criarNovosPedidos(lista, dados, dataAtual, grupoPedido));
  };

  const enviarOferta = (id, preco) => {
    const dataOferta = new Date();
    setPedidos((lista) => atualizarOfertaPedido(lista, id, preco, usuario, dataOferta));
  };

  const editarPedido = (id, dados) => {
    const dataAtual = new Date();
    const idBase = Date.now();
    setPedidos((lista) => editarGrupoPedidos(lista, id, dados, dataAtual, idBase));
  };

  return { pedidos, criarPedido, enviarOferta, editarPedido };
}
