<<<<<<< Updated upstream
export function atualizarDigitoCodigo(codigo, indice, valor) {
  const digito = valor.replace(/\D/g, '').slice(0, 1);

  return codigo.map((item, posicao) =>
    posicao === indice ? digito : item,
  );
}
=======
export function atualizarDigitoCodigo(codigo, indice, valor) {
  const digito = valor.replace(/\D/g, '').slice(0, 1);

  return codigo.map((item, posicao) =>
    posicao === indice ? digito : item,
  );
}

export function voltarDigitoCodigo(codigo, indice) {
  const proximoCodigo = [...codigo];

  if (proximoCodigo[indice]) {
    proximoCodigo[indice] = '';
    return { codigo: proximoCodigo, indiceFoco: indice };
  }

  const indiceAnterior = Math.max(0, indice - 1);
  if (indice > 0) proximoCodigo[indiceAnterior] = '';

  return { codigo: proximoCodigo, indiceFoco: indiceAnterior };
}
>>>>>>> Stashed changes
