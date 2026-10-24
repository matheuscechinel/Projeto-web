export function atualizarDigitoCodigo(codigo, indice, valor) {
  const digito = valor.replace(/\D/g, '').slice(0, 1);

  return codigo.map((item, posicao) =>
    posicao === indice ? digito : item,
  );
}
