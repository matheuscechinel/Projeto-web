import { useState } from 'react';
/* so trocar ou tirar depois, ou so vai ter um aqui */
const contasAutorizadas = [
  { email: 'admin@plataforma.com', papel: 'admin', empresa: 'Administração' },
  { email: 'henrique@empresa.com', papel: 'fornecedor', empresa: 'Henrique Alimentos' },
  { email: 'carla@empresa.com', papel: 'fornecedor', empresa: 'Carla Distribuidora' },
];

export default function TelaLogin({ aoEntrar }) {
  const [formulario, setFormulario] = useState({ nome: '', email: '' });
  const [erro, setErro] = useState('');

  const atualizarCampo = ({ target: { name, value } }) => setFormulario((dados) => ({ ...dados, [name]: value }));
  const entrar = (evento) => {
    evento.preventDefault();
    const conta = contasAutorizadas.find((item) => item.email === formulario.email.trim().toLowerCase());
    if (!conta) {
      setErro('E-mail não correspondem a uma conta cadastrada.');
      return;
    }
    aoEntrar({ ...formulario, papel: conta.papel, empresa: conta.empresa });
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
