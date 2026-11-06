import { useState } from 'react';
import TelaLogin from '../TelaLogin';
import CodigoVerificar from '../paginas/Codigoverificar';

export default function FluxoAutenticacao({ aoAutenticar }) {
  const [etapa, setEtapa] = useState('login');
  const [dadosPendentes, setDadosPendentes] = useState(null);

  if (etapa === 'verificacao' && dadosPendentes) {
    return (
    <CodigoVerificar
      email={dadosPendentes.email}
      aoEntrar={(usuario) => aoAutenticar({ ...dadosPendentes, ...usuario })}
    />
    );
  }

  return (
    <TelaLogin
      aoSolicitarCodigo={(dados) => {
        setDadosPendentes(dados);
        setEtapa('verificacao');
      }}
    />
  );
}
