import { useState } from 'react';

const COR_FUNDO_PADRAO = '#141417';
const CHAVE_COR_FUNDO = 'cor-fundo-admin';

export function lerCorFundoAdmin(armazenamento) {
  return armazenamento.getItem(CHAVE_COR_FUNDO) || COR_FUNDO_PADRAO;
}

export function salvarCorFundoAdmin(armazenamento, cor) {
  armazenamento.setItem(CHAVE_COR_FUNDO, cor);
}

export function removerCorFundoAdmin(armazenamento) {
  armazenamento.removeItem(CHAVE_COR_FUNDO);
}

export function useTemaAdmin() {
  const [corFundoAdmin, setCorFundoAdmin] = useState(
    () => lerCorFundoAdmin(localStorage),
  );

  const alterarCorFundoAdmin = (cor) => {
    setCorFundoAdmin(cor);
    salvarCorFundoAdmin(localStorage, cor);
  };

  const restaurarCorFundoAdmin = () => {
    setCorFundoAdmin(COR_FUNDO_PADRAO);
    removerCorFundoAdmin(localStorage);
  };

  return { corFundoAdmin, alterarCorFundoAdmin, restaurarCorFundoAdmin };
}
