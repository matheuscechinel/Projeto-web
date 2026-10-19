import { useRef, useState } from 'react';
import '../estilos/Verificar.css';
import { atualizarDigitoCodigo } from '../funcionamento_da_verificacao/atualizarDigitoCodigo.js';

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
          <h1>Foi enviado um código de verificação para </h1>
          {email && <p className="email-verificacao">{email}</p>}
        </header>

        <form onSubmit={confirmar}>
          <label>Digite o código</label>

          <div className="codigo-campos">
            {codigo.map((digito, indice) => (
              <input
                key={indice}
                ref={(campo) => {
                  camposCodigo.current[indice] = campo;
                }}
                aria-label={`Dígito ${indice + 1}`}
                inputMode="numeric"
                maxLength={1}
                value={digito}
                onChange={(evento) =>
                  atualizardigito(indice, evento.target.value)
                }
              />
            ))}
          </div>

          {erro && <p className="erro-codigo">{erro}</p>}

          <button className="acao-principal" type="submit">
            Confirmar
          </button>
        </form>
      </section>
    </main>
  );
}
