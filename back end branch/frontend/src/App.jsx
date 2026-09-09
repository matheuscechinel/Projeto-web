import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import CrudTable from "./components/CrudTable.jsx";

const RESOURCES = {
  fornecedores: {
    title: "Fornecedores",
    subtitle: "Empresas que enviam ofertas para os pedidos.",
    fields: [
      { key: "nome", label: "Nome", type: "text", required: true },
      { key: "email", label: "E-mail", type: "email", required: true },
      { key: "senha", label: "Senha", type: "password", required: true},
      { key: "ativo", label: "Ativo", type: "checkbox" },
    ],
  },
  produtos: {
    title: "Produtos",
    subtitle: "Itens que podem compor uma lista de pedido.",
    fields: [
      { key: "nome", label: "Nome", type: "text", required: true },
      { key: "ativo", label: "Ativo", type: "checkbox" },
    ],
  },
  listas: {
    title: "Listas",
    subtitle: "Quantidade de cada produto dentro de um pedido.",
    fields: [
      { key: "pedido_id", label: "ID do pedido", type: "number", required: true },
      { key: "produto_id", label: "ID do produto", type: "number", required: true },
      { key: "quantidade", label: "Quantidade", type: "decimal", required: true },
    ],
  },
};

export default function App() {
  const [active, setActive] = useState("fornecedores");
  const config = RESOURCES[active];

  return (
    <div className="app-shell">
      <Sidebar active={active} onSelect={setActive} />
      <main className="content">
        <CrudTable resource={active} {...config} />
      </main>
    </div>
  );
}
