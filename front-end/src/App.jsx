import { useState } from 'react';
import './estilos.css';
import { usePedidos } from './configui_pedido_tema/config_pedido';
import { useTemaAdmin } from './configui_pedido_tema/TemaAdmin';
import FluxoAutenticacao from './funcionamento_da_verificacao/FluxoAutenticacao';
import LayoutAplicacao from './componentes/LayoutAplicacao';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const { pedidos, criarPedido, enviarOferta, editarPedido } = usePedidos(usuario);
  const {
    corFundoAdmin,
    alterarCorFundoAdmin,
    restaurarCorFundoAdmin,
  } = useTemaAdmin();

  const entrar = (dados) => setUsuario(dados);
  const sair = () => setUsuario(null);

  if (!usuario) {
    return <FluxoAutenticacao aoAutenticar={entrar} />;
  }

  return (
    <LayoutAplicacao
      usuario={usuario}
      pedidos={pedidos}
      criarPedido={criarPedido}
      enviarOferta={enviarOferta}
      editarPedido={editarPedido}
      corFundoAdmin={corFundoAdmin}
      aoAlterarCorFundo={alterarCorFundoAdmin}
      aoRestaurarCorFundo={restaurarCorFundoAdmin}
      aoSair={sair}
    />
  );
}
