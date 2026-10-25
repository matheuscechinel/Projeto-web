import { useMemo, useState } from 'react';
import {
  comporDataISO,
  filtrarPedidosEdicao,
  formatarDataBrasileira,
} from '../dados/formatar_data.js';

const estabelecimentos = ['Restaurante', 'Sushi 1', 'Sushi 2'];

const contasIniciais = [
  { id: 1, nome: 'Henrique Alves', email: 'henrique@empresa.com', acessos: ['Restaurante'] },
  { id: 2, nome: 'Carla Ribeiro', email: 'carla@empresa.com', acessos: ['Sushi 1', 'Sushi 2'] },
  { id: 3, nome: 'Amanda Vieira', email: 'amanda@empresa.com', acessos: [] },
];

const contaVazia = { nome: '', email: '', acessos: [] };
const pedidoVazio = {
  nome: '',
  quantidade: '',
  unidade: 'Unidades',
  estabelecimentos: ['Restaurante'],
  prazo: '7',
  modoValidade: 'semana',
  validadeEscolhida: '',
};

function Cartao({ id, icone, titulo, descricao, ativo, aoClicar }) {
  return (
    <button
      type="button"
      className={ativo ? 'cartao-configuracao ativo' : 'cartao-configuracao'}
      onClick={() => aoClicar(id)}
    >
      <i>{icone}</i>
      <span>
        <b>{titulo}</b>
        <small>{descricao}</small>
      </span>
      <em>›</em>
    </button>
  );
}

function obterDataDeUmaSemana() {
  const data = new Date();
  data.setDate(data.getDate() + 7);
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0'),
  ].join('-');
}

function SeletorDataValidade({ valor, aoAlterar }) {
  const dataInicial = valor || obterDataDeUmaSemana();
  const [ano, mes, dia] = dataInicial.split('-').map(Number);
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: Math.max(11, ano - anoAtual + 1) }, (_, indice) => anoAtual + indice);
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const atualizarData = (novoDia, novoMes, novoAno) => {
    aoAlterar(comporDataISO(novoDia, novoMes, novoAno));
  };

  return (
    <div className="seletor-data-validade">
      <span>Escolha a data de validade</span>
      <div className="campos-seletor-data">
        <label>Dia
          <select aria-label="Dia da validade" value={dia} onChange={(evento) => atualizarData(Number(evento.target.value), mes, ano)}>
            {Array.from({ length: diasNoMes }, (_, indice) => indice + 1).map((numero) => (
              <option key={numero} value={numero}>{String(numero).padStart(2, '0')}</option>
            ))}
          </select>
        </label>
        <label>Mês
          <select aria-label="Mês da validade" value={mes} onChange={(evento) => atualizarData(dia, Number(evento.target.value), ano)}>
            {meses.map((nome, indice) => <option key={nome} value={indice + 1}>{nome}</option>)}
          </select>
        </label>
        <label>Ano
          <select aria-label="Ano da validade" value={ano} onChange={(evento) => atualizarData(dia, mes, Number(evento.target.value))}>
            {anos.map((numero) => <option key={numero} value={numero}>{numero}</option>)}
          </select>
        </label>
      </div>
      <small>Validade selecionada: {formatarDataBrasileira(valor)}</small>
    </div>
  );
}

function FormularioPedido({ dados, aoAlterar, aoEnviar, textoBotao }) {
  const destinos = dados.estabelecimentos
    ?? [dados.estabelecimento].filter(Boolean);
  const alternarEstabelecimento = (nome) => {
    const selecionado = destinos.includes(nome);
    const novosDestinos = selecionado
      ? destinos.filter((item) => item !== nome)
      : [...destinos, nome];
    aoAlterar({ ...dados, estabelecimentos: novosDestinos });
  };

  return (
    <form className="formulario-configuracao" onSubmit={aoEnviar}>
      <label>
        Nome do produto
        <input
          required
          value={dados.nome}
          onChange={(e) => aoAlterar({ ...dados, nome: e.target.value })}
        />
      </label>

      <div className="duas-colunas">
        <label>
          Quantidade
          <input
            required
            type="number"
            min="1"
            value={dados.quantidade}
            onChange={(e) => aoAlterar({ ...dados, quantidade: e.target.value })}
          />
        </label>
        <label>
          Unidade
          <select
            value={dados.unidade}
            onChange={(e) => aoAlterar({ ...dados, unidade: e.target.value })}
          >
            <option>Unidades</option>
            <option>Kg</option>
            <option>Caixa</option>
            <option>Litro</option>
          </select>
        </label>
      </div>

      <fieldset className="seletor-estabelecimentos">
        <legend>Estabelecimentos</legend>
        {estabelecimentos.map((nome) => (
          <label className="linha-checkbox" key={nome}>
            <input
              type="checkbox"
              checked={destinos.includes(nome)}
              onChange={() => alternarEstabelecimento(nome)}
            />
            {nome}
          </label>
        ))}
      </fieldset>

      <fieldset className="seletor-prazo-validade">
        <legend>Prazo de validade</legend>
        <div className="opcoes-prazo-validade">
          <button
            type="button"
            className={dados.modoValidade !== 'data' ? 'selecionado' : ''}
            aria-pressed={dados.modoValidade !== 'data'}
            onClick={() => aoAlterar({ ...dados, prazo: '7', modoValidade: 'semana', validadeEscolhida: '' })}
          >
            Uma semana
          </button>
          <button
            type="button"
            className={dados.modoValidade === 'data' ? 'selecionado' : ''}
            aria-pressed={dados.modoValidade === 'data'}
            onClick={() => aoAlterar({
              ...dados,
              modoValidade: 'data',
              validadeEscolhida: dados.validadeEscolhida || obterDataDeUmaSemana(),
            })}
          >
            Escolher data
          </button>
        </div>
        {dados.modoValidade === 'data' && (
          <SeletorDataValidade
            valor={dados.validadeEscolhida}
            aoAlterar={(validadeEscolhida) => aoAlterar({ ...dados, validadeEscolhida })}
          />
        )}
      </fieldset>

      <button
        className="acao-principal"
        disabled={destinos.length === 0 || (dados.modoValidade === 'data' && !formatarDataBrasileira(dados.validadeEscolhida))}
      >
        {textoBotao}
      </button>
    </form>
  );
}

export default function Configuracoes({
  pedidos,
  aoCriarPedido,
  aoEditarPedido,
  aoVoltar,
  aoSimularFornecedor,
  simulando,
  corFundo,
  aoAlterarCorFundo,
  aoRestaurarCorFundo,
  tipografia,
  aoAlterarTipografia,
  fornecedores = [],
  fornecedorSelecionado,
  aoSelecionarFornecedor,
}) {
  const [secao, setSecao] = useState('contas');
  const [contas, setContas] = useState(contasIniciais);
  const [conta, setConta] = useState(contaVazia);
  const [contaEditando, setContaEditando] = useState(null);
  const [formContaVisivel, setFormContaVisivel] = useState(false);
  const [novoPedido, setNovoPedido] = useState(pedidoVazio);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [local, setLocal] = useState('todos');
  const [buscaEdicao, setBuscaEdicao] = useState('');
  const [localEdicao, setLocalEdicao] = useState('todos');
  const historico = useMemo(() => {
    return pedidos.filter(
      (pedido) =>
        (local === 'todos' || pedido.estabelecimento === local)
        && pedido.nome.toLowerCase().includes(busca.toLowerCase()),
    );
  }, [pedidos, busca, local]);
  const pedidosEditaveis = useMemo(
    () => filtrarPedidosEdicao(pedidos, buscaEdicao, localEdicao),
    [pedidos, buscaEdicao, localEdicao],
  );

  const alternarAcesso = (nome) => {
    setConta((atual) => ({
      ...atual,
      acessos: atual.acessos.includes(nome)
        ? atual.acessos.filter((item) => item !== nome)
        : [...atual.acessos, nome],
    }));
  };

  const salvarConta = (e) => {
    e.preventDefault();
    if (contaEditando) {
      setContas((lista) =>
        lista.map((item) =>
          item.id === contaEditando ? { ...item, ...conta } : item,
        ),
      );
    } else {
      setContas((lista) => [...lista, { ...conta, id: Date.now() }]);
    }
    setConta(contaVazia);
    setContaEditando(null);
    setFormContaVisivel(false);
  };

  const enviarNovoPedido = (e) => {
    e.preventDefault();
    aoCriarPedido(novoPedido);
    setNovoPedido(pedidoVazio);
  };

  const salvarPedido = (e) => {
    e.preventDefault();
    aoEditarPedido(pedidoEditando.id, {
      ...pedidoEditando,
      quantidade: Number(pedidoEditando.quantidade),
    });
    setPedidoEditando(null);
  };

  const opcoes = [
    ['contas', '▣', 'Gerenciar contas', 'Acessos e permissões'],
    ['pedido', '＋', 'Novo pedido', 'Solicitação rápida'],
    ['editar-pedidos', '✎', 'Editar pedidos', 'Dados e validade'],
    ['preferencias', '✦', 'Preferências', 'Aparência e visualização'],
    ['historico', '◷', 'Histórico geral', 'Pedidos por data e local']
  ];

  return (
    <section className="pagina configuracoes">
      <header className="cabecalho-configuracoes">
        <div>
          <p className="sobretitulo">ADMINISTRAÇÃO</p>
          <h1>Configurações e pedidos</h1>
          <p>Gerencie acessos, pedidos e preferências do sistema.</p>
        </div>
        <button type="button" className="acao-tabela botao-voltar" onClick={aoVoltar}>
          ← Voltar
        </button>
      </header>

      <div className="layout-configuracoes">
        <nav className="menu-configuracoes">
          {opcoes.map(([id, icone, titulo, descricao]) => (
            <Cartao
              key={id}
              id={id}
              icone={icone}
              titulo={titulo}
              descricao={descricao}
              ativo={secao === id}
              aoClicar={setSecao}
            />
          ))}
        </nav>

        <main className="painel-configuracao">
          {secao === 'contas' && (
            <>
              <header className="cabecalho-painel">
                <div>
                  <h2>Gerenciar contas</h2>
                  <p>Contas criadas e acessos vinculados.</p>
                </div>
                <button
                  className="acao-tabela"
                  onClick={() => { setConta(contaVazia); setContaEditando(null); setFormContaVisivel(true); }}
                >
                  + Nova conta
                </button>
              </header>

              {formContaVisivel && (
                <form className="formulario-configuracao" onSubmit={salvarConta}>
                  <label>
                    Nome
                    <input required value={conta.nome} onChange={(e) => setConta({ ...conta, nome: e.target.value })} />
                  </label>
                  <label>
                    E-mail
                    <input required type="email" value={conta.email} onChange={(e) => setConta({ ...conta, email: e.target.value })} />
                  </label>
                  <fieldset>
                    <legend>Permissões por estabelecimento</legend>
                    {estabelecimentos.map((nome) => (
                      <label className="linha-checkbox" key={nome}>
                        <input type="checkbox" checked={conta.acessos.includes(nome)} onChange={() => alternarAcesso(nome)} />
                        {nome}
                      </label>
                    ))}
                  </fieldset>
                  <button className="acao-principal">Salvar conta</button>
                </form>
              )}

              <h3>Contas criadas</h3>
              <div>
                {contas.map((item) => (
                  <article className="linha-conta" key={item.id}>
                    <span>
                      {item.nome
                        .split(/\s+/)
                        .map((parte) => parte[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <div>
                      <b>{item.nome}</b>
                      <small>{item.email}</small>
                      <em>{item.acessos.join(' · ') || 'Sem acesso vinculado'}</em>
                    </div>
                    <button
                      className="acao-tabela"
                      onClick={() => {
                        setConta({ ...item });
                        setContaEditando(item.id);
                        setFormContaVisivel(true);
                      }}
                    >
                      Permissões
                    </button>
                    <button
                      className="acao-tabela excluir"
                      onClick={() =>
                        setContas((lista) =>
                          lista.filter((contaAtual) => contaAtual.id !== item.id),
                        )
                      }
                    >
                      Excluir
                    </button>
                  </article>
                ))}
              </div>
            </>
          )} 
            
          {secao === 'pedido' && (
            <>
              <header className="cabecalho-painel">
                <div>
                  <h2>Novo pedido</h2>
                  <p>A validade será mostrada para o fornecedor.</p>
                </div>
              </header>
              <FormularioPedido
                dados={novoPedido}
                aoAlterar={setNovoPedido}
                aoEnviar={enviarNovoPedido}
                textoBotao="Enviar pedido"
              />
            </>
          )}

          {secao === 'editar-pedidos' && (
            <>
              <header className="cabecalho-painel">
                <div>
                  <h2>Editar pedidos</h2>
                  <p>Altere informações e prazo de validade.</p>
                </div>
              </header>
              {pedidoEditando ? (
                <FormularioPedido
                  dados={pedidoEditando}
                  aoAlterar={setPedidoEditando}
                  aoEnviar={salvarPedido}
                  textoBotao="Salvar alterações"
                />
              ) : (
                <>
                  <div className="controles-lista filtros-edicao">
                    <label>
                      Estabelecimento
                      <select value={localEdicao} onChange={(e) => setLocalEdicao(e.target.value)}>
                        <option value="todos">Todos</option>
                        {estabelecimentos.map((nome) => <option key={nome}>{nome}</option>)}
                      </select>
                    </label>
                    <label className="campo-busca">
                      Buscar pedido
                      <input
                        type="search"
                        aria-label="Buscar pedido pelo nome do produto"
                        value={buscaEdicao}
                        onChange={(e) => setBuscaEdicao(e.target.value)}
                        placeholder="Nome do produto"
                      />
                    </label>
                  </div>
                  <div className="lista-historico">
                  {pedidosEditaveis.map((pedido) => (
                    <article key={pedido.id}>
                      <b>{pedido.nome}</b>
                      <span>{pedido.estabelecimento}</span>
                      <span>Válido até {pedido.validade}</span>
                      <button className="acao-tabela" onClick={() => {
                        const grupoPedido = pedido.grupoPedido ?? pedido.id;
                        const destinos = pedidos
                          .filter((item) => (item.grupoPedido ?? item.id) === grupoPedido)
                          .map((item) => item.estabelecimento);
                        setPedidoEditando({
                          ...pedido,
                          estabelecimentos: destinos,
                          prazo: '7',
                          modoValidade: 'semana',
                          validadeEscolhida: '',
                        });
                      }}>
                        Editar
                      </button>
                    </article>
                  ))}
                  {!pedidosEditaveis.length && (
                    <p className="estado-vazio">Nenhum pedido corresponde aos filtros.</p>
                  )}
                  </div>
                </>
              )}
            </>
          )}

          {secao === 'preferencias' && (
            <>
              <header className="cabecalho-painel">
                <div>
                  <h2>Preferências do sistema</h2>
                  <p>Personalize a aparência e a visualização.</p>
                </div>
              </header>
              <div className="formulario-configuracao">
                <div className="campo-cor">
                  <span>Cor de fundo</span>
                  <div className="acoes-cor">
                    <input
                      aria-label="Selecionar cor de fundo"
                      type="color"
                      value={corFundo}
                      onChange={(e) => aoAlterarCorFundo(e.target.value)}
                    />
                    <button type="button" className="acao-tabela" onClick={aoRestaurarCorFundo}>
                      Voltar ao padrão
                    </button>
                  </div>
                </div>
                <label>Tipografia
                  <select value={tipografia} onChange={(e) => aoAlterarTipografia(e.target.value)}>
                    <option>DM Sans</option>
                    <option>Instrument Serif</option>
                    <option>Arial</option>
                  </select>
                </label>
                <hr />
                <label>
                  Fornecedor para visualizar
                  <select
                    value={fornecedorSelecionado?.email ?? ''}
                    onChange={(e) => aoSelecionarFornecedor(e.target.value)}
                    disabled={!fornecedores.length}
                  >
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.email} value={fornecedor.email}>
                        {fornecedor.empresa} — {fornecedor.email}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="alternador">
                  <span id="rotulo-visao-fornecedor">Visão como fornecedor</span>
                  <button
                    type="button"
                    className="botao-alternador"
                    role="switch"
                    aria-checked={simulando}
                    aria-labelledby="rotulo-visao-fornecedor"
                    onClick={() => aoSimularFornecedor(!simulando)}
                  />
                </div>
              </div>
            </>
          )}

          {secao === 'historico' && (
            <>
              <header className="cabecalho-painel">
                <div>
                  <h2>Histórico geral</h2>
                  <p>Pedidos organizados por data e estabelecimento.</p>
                </div>
              </header>
              <div className="controles-lista">
                <label>
                  Estabelecimento
                  <select value={local} onChange={(e) => setLocal(e.target.value)}>
                    <option value="todos">Todos</option>
                    {estabelecimentos.map((nome) => <option key={nome}>{nome}</option>)}
                  </select>
                </label>
                <label className="campo-busca">
                  Busca avançada
                  <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Produto, data ou local" />
                </label>
              </div>
              <div className="lista-historico">
                {historico.map((pedido) => (
                  <article key={pedido.id}>
                    <b>{pedido.nome}</b>
                    <span>{pedido.dataOferta}</span>
                    <span>{pedido.estabelecimento}</span>
                    <em>Válido até {pedido.validade}</em>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
}
