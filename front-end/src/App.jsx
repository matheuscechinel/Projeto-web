import { useState } from 'react';
import BarraLateral from './componentes/BarraLateral';
import { pedidosIniciais } from './dados/pedidosIniciais';
import TelaLogin from './TelaLogin';
import GestaoAdministrador from './paginas/GestaoAdmin';
import MuralFornecedor from './paginas/tela_Fornecedor';
import './estilos.css';
import './ajustes-finais.css';
import './login-formato.css';
// nao mexer em nada pra eu nao me matar  
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [estabelecimento, setEstabelecimento] = useState('Restaurante');
  const [pedidos, setPedidos] = useState(pedidosIniciais);

  const entrar = (dados) => {
    setUsuario(dados);
  };

  const enviarOferta = (id, preco) => {
    setPedidos((lista) => lista.map((pedido) => pedido.id === id ? {
      ...pedido,
      melhorPreco: pedido.melhorPreco ? Math.min(pedido.melhorPreco, preco) : preco,
      ofertaFornecedor: preco,
      fornecedor: usuario.empresa || usuario.nome || 'Fornecedor',
      dataOferta: new Date().toLocaleDateString('pt-BR'),
    } : pedido));
  };

  const sair = () => setUsuario(null);

  if (!usuario) return <TelaLogin aoEntrar={entrar} />;

  const eAdministrador = usuario.papel === 'admin';
  const conteudo = eAdministrador
    ? <GestaoAdministrador estabelecimento={estabelecimento} pedidos={pedidos} />
    : <MuralFornecedor pedidos={pedidos} aoEnviarOferta={enviarOferta} />;

  return (
    <main className="aplicacao">
      <BarraLateral
        papel={usuario.papel}
        estabelecimento={estabelecimento}
        aoTrocarEstabelecimento={setEstabelecimento}
        aoSair={sair}
      />
      <div className="conteudo-principal">{conteudo}</div>
    </main>
  );
}
