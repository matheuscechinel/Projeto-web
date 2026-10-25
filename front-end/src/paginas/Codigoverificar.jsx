import { useRef, useState } from 'react';
import '../estilos/Verificar.css';
import {
  atualizarDigitoCodigo,
  voltarDigitoCodigo,
} from '../funcionamento_da_verificacao/atualizarDigitoCodigo.js';

/* isso fica so pra testar depois tu troca */
const codigo_autorizado = '123456';
export default function Codigoverificar({ aoEntrar, email }) {
  const camposCodigo = useRef([]);
  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
  const [erro, setErro] = useState('');

  function atualizardigito(indice, valor) {
    setCodigo((atual) => atualizarDigitoCodigo(atual, indice, valor));
    setErro('');

    const digitouNumero = /\d/.test(valor);

    if (digitouNumero && indice < codigo.length - 1) {
      camposCodigo.current[indice + 1]?.focus();
    }
  }

  function voltarAoDigitoAnterior(indice, evento) {
    if (evento.key !== 'Backspace') return;

    evento.preventDefault();
    const resultado = voltarDigitoCodigo(codigo, indice);
    setCodigo(resultado.codigo);
    setErro('');
    camposCodigo.current[resultado.indiceFoco]?.focus();
  }

  function confirmar(evento) {
    evento.preventDefault();

    if (codigo.join('') !== codigo_autorizado) {
      setErro('Código inválido.');
      return;
    }

    aoEntrar();
  }

  return (
    <main className="tela-codigo">
      <section className="cartao-codigo">
        <header>
          <h1>Verifique seu e-mail</h1>
          <p className="descricao-verificacao">
            Enviamos um código de 6 dígitos para
          </p>
          {email && <p className="email-verificacao">{email}</p>}
        </header>

        <form onSubmit={confirmar}>
          <label htmlFor="codigo-digito-1">Digite o código</label>

          <div className="codigo-campos">
            {codigo.map((digito, indice) => (
              <input
                key={indice}
                id={indice === 0 ? 'codigo-digito-1' : undefined}
                ref={(campo) => {
                  camposCodigo.current[indice] = campo;
                }}
                aria-label={`Dígito ${indice + 1}`}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? 'erro-codigo' : undefined}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digito}
                onKeyDown={(evento) => voltarAoDigitoAnterior(indice, evento)}
                onChange={(evento) =>
                  atualizardigito(indice, evento.target.value)
                }
              />
            ))}
          </div>

          {erro && (
            <p className="erro-codigo" id="erro-codigo" role="alert">
              {erro}
            </p>
          )}

          <button className="acao-principal" type="submit">
            Confirmar código
          </button>
        </form>
      </section>
    </main>
  );
}
