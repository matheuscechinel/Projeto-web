import { useState } from 'react';
import { solicitarCodigo } from './dados/api.js';

export default function TelaLogin({ aoSolicitarCodigo }) {
  const [formulario, setFormulario] = useState({ nome: '', email: '' });
  const [erro, setErro] = useState('');

  const atualizarCampo = ({ target: { name, value } }) => setFormulario((dados) => ({ ...dados, [name]: value }));
  const entrar = async (evento) => {
    evento.preventDefault();
    const email = formulario.email.trim().toLowerCase();
    try {
      await solicitarCodigo(email);
      setErro('');
      aoSolicitarCodigo({ ...formulario, email });
    } catch (falha) {
      setErro(falha.status === 404
        ? 'E-mail não correspondem a uma conta cadastrada.'
        : falha.message);
    }
  };

  return (
    <main className="tela-login">
      <section className="cartao-login">
        <header><h1>Login</h1></header>
        <form onSubmit={entrar}>

          <label>USUÁRIO<span className="campo-login"><i>♙</i><input name="nome" value={formulario.nome} onChange={atualizarCampo} placeholder="Seu nome" required /></span>
          </label>

          <label>E-MAIL<span className="campo-login"><i>✉</i><input name="email" type="email" value={formulario.email} onChange={atualizarCampo} placeholder="gmail@algo.com" required /></span>
          </label>
          {erro && <p className="erro-login">{erro}</p>}
          <button className="acao-principal">Confirmar</button>
        </form>
      </section>
    </main>
  );
}
