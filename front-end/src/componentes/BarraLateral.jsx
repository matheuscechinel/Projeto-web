import { useRef, useState } from 'react';

/* aqui agente vai colocar os estabelecimentos como o restaurante e os dois sushis, e tem que trocar os nomes, ta foda so esses dai */

const estabelecimentos = [
  { nome: 'Restaurante', marca: 'R', classe: 'marca-restaurante' },
  { nome: 'Sushi 1', marca: 'S1', classe: 'marca-sushi-um' },
  { nome: 'Sushi 2', marca: 'S2', classe: 'marca-sushi-dois' },
];

export default function BarraLateral({
  papel,
  pagina,
  estabelecimento,
  aoTrocarEstabelecimento,
  aoAbrirEstatisticas,
  aoAbrirConfiguracoes,
  /* provalvelmente agente vai tirar isso, é so pra agilizar */ 
  aoSair,
}) {
  const [foto, setFoto] = useState('');
  const inputFoto = useRef(null);
  const selecionarFoto = (evento) => {
    const arquivo = evento.target.files?.[0];
    if (arquivo) setFoto(URL.createObjectURL(arquivo));
  };

  const eAdministrador = papel === 'admin';

  return (
    <aside className="barra-lateral">
      <div className="espaco-logo" />
      {eAdministrador && (
        <nav className="lista-estabelecimentos" aria-label="Estabelecimentos">
          {estabelecimentos.map(({ nome, marca, classe }) => (
            <button
              className={nome === estabelecimento ? 'estabelecimento ativo' : 'estabelecimento'}
              key={nome}
              onClick={() => aoTrocarEstabelecimento(nome)}
            >
              <i className={`marca-estabelecimento ${classe}`}>{marca}</i>
              <span>{nome}</span>
            </button>
          ))}
        </nav>
      )}
      {eAdministrador && (
        <button
          className={pagina === 'estatisticas' ? 'atalho-estatisticas ativo' : 'atalho-estatisticas'}
          onClick={aoAbrirEstatisticas}
        >
          <i className="marca-estabelecimento marca-estatistica">E</i>
          <span>Estatística</span>
        </button>
      )}
      <div className="rodape-lateral">
        {eAdministrador && <button className="botao-icone" title="Configurações" onClick={aoAbrirConfiguracoes}>⚙</button>}
        <button className="foto-perfil" title="Trocar foto de perfil" onClick={() => inputFoto.current?.click()}>
          {foto ? <img src={foto} alt="Perfil" /> : <span>{eAdministrador ? 'AD' : 'FO'}</span>}
        </button>
        <input ref={inputFoto} type="file" accept="image/*" onChange={selecionarFoto} hidden />
        <button className="botao-sair" title="Sair" onClick={aoSair}>↪</button>
      </div>
    </aside>
  );
}
