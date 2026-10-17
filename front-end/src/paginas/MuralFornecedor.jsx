import { useMemo, useState } from 'react';

const moeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

export default function MuralFornecedor({ pedidos, aoEnviarOferta, emSimulacao = false }) {
  const [categoria, setCategoria] = useState('todos');
  const [busca, setBusca] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [preco, setPreco] = useState('');

  const categorias = useMemo(
    () => [...new Set(pedidos.map((pedido) => pedido.categoria))],
    [pedidos],
  );
  const pedidosVisiveis = pedidos.filter((pedido) => {
    const correspondeCategoria = categoria === 'todos' || pedido.categoria === categoria;
    return correspondeCategoria && pedido.nome.toLowerCase().includes(busca.toLowerCase());
  });

  const enviarOferta = (evento) => {
    evento.preventDefault();
    aoEnviarOferta(pedidoSelecionado.id, Number(preco));
    setPedidoSelecionado(null);
    setPreco('');
  };

  return (
    <section className="pagina mural-fornecedor">
      <header className="cabecalho-pagina">
        <div>
          <p className="sobretitulo">
            FORNECEDOR{emSimulacao && ' — VISUALIZAÇÃO DO ADMIN'}
          </p>
          <h1>Mural de Pedidos</h1>
          <p>Selecione um pedido e envie uma oferta ao estabelecimento.</p>
        </div>
      </header>

      <div className="controles-lista">
        <label>
          Categoria
          <select
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
          >
            <option value="todos">Todos os produtos</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="campo-busca">
          Buscar
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar produto"
          />
        </label>
      </div>

      <div className="lista-pedidos-fornecedor">
        {pedidosVisiveis.map((pedido) => (
          <article className="linha-pedido-fornecedor" key={pedido.id}>
            <div className="imagem-produto" />

            <div className="informacoes-produto">
              <h2>{pedido.nome}</h2>
              <small className="validade-pedido">
                Válido até {pedido.validade}
              </small>
            </div>

            <div className="quantidade-pedida">
              <span>Quantidade solicitada</span>
              <b>
                {pedido.quantidade} {pedido.unidade}
              </b>
            </div>

            {pedido.ofertaFornecedor !== null && (
              <span className="oferta-salva">
                Sua oferta: {moeda(pedido.ofertaFornecedor)}
              </span>
            )}

            <button
              className="botao-ofertar"
              disabled={emSimulacao}
              onClick={() => {
                setPedidoSelecionado(pedido);
                setPreco(pedido.ofertaFornecedor ?? '');
              }}
            >
              {pedido.ofertaFornecedor !== null ? 'Editar oferta' : 'Ofertar'}
            </button>
          </article>
        ))}
      </div>

      {pedidoSelecionado && (
        <div className="fundo-modal">
          <form className="modal-oferta" onSubmit={enviarOferta}>
            <button
              type="button"
              className="fechar-modal"
              onClick={() => setPedidoSelecionado(null)}
            >
              ×
            </button>

            <p className="sobretitulo">NOVA OFERTA</p>
            <h2>{pedidoSelecionado.nome}</h2>
            <p>
              O administrador solicitou{' '}
              <b>
                {pedidoSelecionado.quantidade} {pedidoSelecionado.unidade}
              </b>
              .
            </p>

            <label>
              Preço total da oferta (R$)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={preco}
                onChange={(evento) => setPreco(evento.target.value)}
                required
              />
            </label>

            <button className="acao-principal">Enviar oferta</button>
          </form>
        </div>
      )}
    </section>
  );
}
