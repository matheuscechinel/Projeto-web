import { useState } from 'react';
import BarraLateral from './componentes/BarraLateral';
import { pedidosIniciais } from './dados/pedidosIniciais';
import TelaLogin from './TelaLogin';
import Configuracoes from './paginas/Configuracoes';
import Estatisticas from './paginas/Estatisticas';
import GestaoAdministrador from './paginas/GestaoAdministrador';
import MuralFornecedor from './paginas/MuralFornecedor';
import './estilos.css';

const COR_FUNDO_PADRAO = '#141417';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pagina, setPagina] = useState('gestao');
  const [estabelecimento, setEstabelecimento] = useState('Restaurante');
  const [simulandoFornecedor, setSimulandoFornecedor] = useState(false);
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [corFundoAdmin, setCorFundoAdmin] = useState(
    () => localStorage.getItem('cor-fundo-admin') || COR_FUNDO_PADRAO,
  );

  const alterarCorFundoAdmin = (cor) => {
    setCorFundoAdmin(cor);
    localStorage.setItem('cor-fundo-admin', cor);
  };

  const restaurarCorFundoAdmin = () => {
    setCorFundoAdmin(COR_FUNDO_PADRAO);
    localStorage.removeItem('cor-fundo-admin');
  };

  const entrar = (dados) => {
    setUsuario(dados);
    setPagina(dados.papel === 'admin' ? 'gestao' : 'mural');
  };

  const criarPedido = ({
    nome,
    quantidade,
    unidade,
    estabelecimentos,
    estabelecimento: destino,
    prazo,
  }) => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + Number(prazo));
    const destinos = estabelecimentos?.length ? estabelecimentos : [destino];
    const grupoPedido = Date.now();
    const novosPedidos = destinos.map((estabelecimentoPedido, indice) => ({
      id: grupoPedido + indice,
      grupoPedido,
      nome,
      categoria: nome.toLowerCase(),
      quantidade: Number(quantidade),
      unidade: unidade.toLowerCase(),
      melhorPreco: 0,
      ofertaFornecedor: null,
      fornecedor: '',
      dataOferta: new Date().toLocaleDateString('pt-BR'),
      validade: hoje.toLocaleDateString('pt-BR'),
      estabelecimento: estabelecimentoPedido,
      avaliacao: 'Novo',
    }));
    setPedidos((lista) => [...lista, ...novosPedidos]);
  };

  const enviarOferta = (id, preco) => {
    setPedidos((lista) =>
      lista.map((pedido) =>
        pedido.id === id
          ? {
              ...pedido,
              melhorPreco: pedido.melhorPreco
                ? Math.min(pedido.melhorPreco, preco)
                : preco,
              ofertaFornecedor: preco,
              fornecedor: usuario.empresa || usuario.nome || 'Fornecedor',
              dataOferta: new Date().toLocaleDateString('pt-BR'),
            }
          : pedido,
      ),
    );
  };

  const editarPedido = (id, dados) => {
    const limite = new Date();
    limite.setDate(limite.getDate() + Number(dados.prazo));
    setPedidos((lista) => {
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
        id: indice === 0 ? id : Date.now() + indice,
        grupoPedido,
        categoria: dados.nome.toLowerCase(),
        quantidade: Number(dados.quantidade),
        estabelecimento: destino,
        validade: limite.toLocaleDateString('pt-BR'),
      }));

      return [...pedidosNaoRelacionados, ...pedidosAtualizados];
    });
  };

  const sair = () => {
    setUsuario(null);
    setSimulandoFornecedor(false);
    setPagina('gestao');
  };

  if (!usuario) {
    return <TelaLogin aoEntrar={entrar} />;
  }

  const eAdministrador = usuario.papel === 'admin';
  const papelExibido = simulandoFornecedor && eAdministrador ? 'fornecedor' : usuario.papel;
  let conteudo;

  if (simulandoFornecedor) {
    conteudo = (
      <>
        <div className="aviso-simulacao">
          Você está vendo a plataforma como fornecedor.{' '}
          <button
            onClick={() => {
              setSimulandoFornecedor(false);
              setPagina('gestao');
            }}
          >
            Sair da visualização
          </button>
        </div>

        <MuralFornecedor
          pedidos={pedidos}
          aoEnviarOferta={enviarOferta}
          emSimulacao
        />
      </>
    );
  } else if (!eAdministrador || pagina === 'mural') {
    conteudo = (
      <MuralFornecedor pedidos={pedidos} aoEnviarOferta={enviarOferta} />
    );
  } else if (pagina === 'configuracoes') {
    conteudo = (
      <Configuracoes
        pedidos={pedidos}
        aoCriarPedido={criarPedido}
        aoEditarPedido={editarPedido}
        aoVoltar={() => setPagina('gestao')}
        aoSimularFornecedor={(ativo) => {
          setSimulandoFornecedor(ativo);

          if (ativo) {
            setPagina('mural');
          }
        }}
        simulando={simulandoFornecedor}
        corFundo={corFundoAdmin}
        aoAlterarCorFundo={alterarCorFundoAdmin}
        aoRestaurarCorFundo={restaurarCorFundoAdmin}
      />
    );
  } else if (pagina === 'estatisticas') {
    conteudo = <Estatisticas />;
  } else {
    conteudo = <GestaoAdministrador estabelecimento={estabelecimento} pedidos={pedidos} />;
  }

  const modoAdministrador = eAdministrador && !simulandoFornecedor;

  return (
    <main
      className={modoAdministrador ? 'aplicacao modo-admin' : 'aplicacao'}
      style={
        modoAdministrador ? { '--fundo-admin': corFundoAdmin } : undefined
      }
    >
      <BarraLateral
        papel={papelExibido}
        pagina={pagina}
        estabelecimento={estabelecimento}
        aoTrocarEstabelecimento={(nome) => {
          setEstabelecimento(nome);
          setPagina('gestao');
        }}
        aoAbrirEstatisticas={() => setPagina('estatisticas')}
        aoAbrirConfiguracoes={() => setPagina('configuracoes')}
        aoSair={sair}
      />

      <div className="conteudo-principal">{conteudo}</div>
    </main>
  );
}
