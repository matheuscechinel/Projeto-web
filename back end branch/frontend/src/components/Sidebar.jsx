const ITEMS = [
  { key: "fornecedores", label: "Fornecedores", hint: "Quem oferta" },
  { key: "produtos", label: "Produtos", hint: "O que é cotado" },
  { key: "listas", label: "Listas", hint: "Itens por pedido" },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">C</span>
        <div>
          <strong>Comprass</strong>
          <small>painel interno</small>
        </div>
      </div>
      <nav>
        {ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${active === item.key ? "active" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            <span className="nav-label">{item.label}</span>
            <span className="nav-hint">{item.hint}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
