import { useMemo, useState } from 'react';

const moeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

export default function GestaoAdministrador({ estabelecimento, pedidos }) {
  const [filtro, setFiltro] = useState('geral');
  const [busca, setBusca] = useState('');

  const pedidosVisiveis = useMemo(() => {
    const pedidosDoEstabelecimento = pedidos
      .filter((pedido) => pedido.estabelecimento === estabelecimento)
      .filter((pedido) => pedido.nome.toLowerCase().includes(busca.toLowerCase()));

    if (filtro === 'melhores') {
      return Object.values(
        pedidosDoEstabelecimento.reduce((melhores, pedido) => {
          const atual = melhores[pedido.categoria];

          if (!atual || pedido.melhorPreco < atual.melhorPreco) {
            melhores[pedido.categoria] = pedido;
          }

          return melhores;
        }, {}),
      ).sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return [...pedidosDoEstabelecimento].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [busca, estabelecimento, filtro, pedidos]);

  return (
    <section className="pagina gestao-administrador">
      <header className="cabecalho-gestao">
        <div>
          <h1>Gestão {estabelecimento}</h1>
          <p>Painel operacional</p>
        </div>
        <span>•</span>
      </header>

      <div className="controles-lista controles-gestao">
        <label>
          Filtro
          <select
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
          >
            <option value="geral">Produtos (Geral)</option>
            <option value="melhores">Melhores preços</option>
          </select>
        </label>

        <label className="campo-busca">
          Buscar produto
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar produto"
          />
        </label>
      </div>

      <section className="lista-pedidos-admin">
        {pedidosVisiveis.map((pedido) => (
          <article className="linha-pedido-admin" key={pedido.id}>
            <div className="imagem-produto" />

            <div className="informacoes-produto">
              <div>
                <h2>{pedido.nome}</h2>
                <span>{pedido.fornecedor || 'Fornecedor pendente'}</span>
              </div>
              <p>★ {pedido.avaliacao} Avaliação</p>
            </div>

            <small>Oferta em {pedido.dataOferta}</small>
            <button className="botao-ofertar" type="button">
              Ofertar
            </button>
            <b>{moeda(pedido.melhorPreco)}</b>
            <em className="quantidade-valor">
              {pedido.quantidade} {pedido.unidade}
            </em>
          </article>
        ))}

        {pedidosVisiveis.length === 0 && (
          <p className="estado-vazio">Nenhum produto encontrado.</p>
        )}
      </section>
    </section>
  );
}
