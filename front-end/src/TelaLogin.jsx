import { useState } from 'react';
// criacao de contas pa teste, mandar para as pessoas que entrar depois
const contasAutorizadas = [
  { email: 'admin@plataforma.com', senha: '123456', papel: 'admin', empresa: 'Administração' },
  { email: 'henrique@empresa.com', senha: '123456', papel: 'fornecedor', empresa: 'Henrique Alimentos' },
  { email: 'carla@empresa.com', senha: '123456', papel: 'fornecedor', empresa: 'Carla Distribuidora' },
];

export default function TelaLogin({ aoEntrar }) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro] = useState('');

  const atualizarCampo = ({ target: { name, value } }) => setFormulario((dados) => ({ ...dados, [name]: value }));
  const entrar = (evento) => {
    evento.preventDefault();
    const conta = contasAutorizadas.find((item) => item.email === formulario.email.trim().toLowerCase() && item.senha === formulario.senha);
    if (!conta) {
      setErro('E-mail ou senha não correspondem a uma conta cadastrada.');
      return;
    }
    aoEntrar({ ...formulario, papel: conta.papel, empresa: conta.empresa });
  };

  return (
    <main className="tela-login">
      <section className="cartao-login">
        <header><h1>Login</h1><p>Acesse sua conta para gerenciar seu espaço.</p></header>
        <form onSubmit={entrar}>
          <label>USUÁRIO<span className="campo-login"><i>♙</i><input name="nome" value={formulario.nome} onChange={atualizarCampo} placeholder="Seu identificador único" required /></span></label>
          <label>E-MAIL<span className="campo-login"><i>✉</i><input name="email" type="email" value={formulario.email} onChange={atualizarCampo} placeholder="exemplo@dominio.com" required /></span></label>
          <label>SENHA<span className="campo-login"><i>♧</i><input name="senha" type={mostrarSenha ? 'text' : 'password'} value={formulario.senha} onChange={atualizarCampo} placeholder="••••••••" required /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? '◉' : '⊙'}</button></span></label>
          <label className="mostrar-senha"><input type="checkbox" checked={mostrarSenha} onChange={() => setMostrarSenha(!mostrarSenha)} /><i/> Mostrar senha</label>
          {erro && <p className="erro-login">{erro}</p>}
          <button className="acao-principal">Confirmar</button>
        </form>
      </section>
    </main>
  );
}
