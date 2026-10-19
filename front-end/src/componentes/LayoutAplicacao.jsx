import { useState } from 'react';
import BarraLateral from './BarraLateral';
import Configuracoes from '../paginas/Configuracoes';
import Estatisticas from '../paginas/Estatisticas';
import GestaoAdministrador from '../paginas/GestaoAdministrador';
import MuralFornecedor from '../paginas/MuralFornecedor';

export default function LayoutAplicacao({
  usuario,
  pedidos,
  criarPedido,
  enviarOferta,
  editarPedido,
  corFundoAdmin,
  aoAlterarCorFundo,
  aoRestaurarCorFundo,
  aoSair,
}) {
  const eAdministrador = usuario.papel === 'admin';
  const [pagina, setPagina] = useState(eAdministrador ? 'gestao' : 'mural');
  const [estabelecimento, setEstabelecimento] = useState('Restaurante');
  const [simulandoFornecedor, setSimulandoFornecedor] = useState(false);

  const papelExibido = simulandoFornecedor && eAdministrador
    ? 'fornecedor'
    : usuario.papel;
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
        aoAlterarCorFundo={aoAlterarCorFundo}
        aoRestaurarCorFundo={aoRestaurarCorFundo}
      />
    );
  } else if (pagina === 'estatisticas') {
    conteudo = <Estatisticas />;
  } else {
    conteudo = (
      <GestaoAdministrador
        estabelecimento={estabelecimento}
        pedidos={pedidos}
      />
    );
  }

  const modoAdministrador = eAdministrador && !simulandoFornecedor;

  return (
    <main
      className={modoAdministrador ? 'aplicacao modo-admin' : 'aplicacao'}
      style={modoAdministrador ? { '--fundo-admin': corFundoAdmin } : undefined}
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
        aoSair={aoSair}
      />

      <div className="conteudo-principal">{conteudo}</div>
    </main>
  );
}
