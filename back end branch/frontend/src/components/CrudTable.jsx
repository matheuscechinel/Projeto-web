import { useEffect, useState } from "react";
import { api } from "../api";

function emptyFromFields(fields) {
  const draft = {};
  fields.forEach((f) => {
    draft[f.key] = f.type === "checkbox" ? true : "";
  });
  return draft;
}

function coerce(fields, draft) {
  const out = {};
  fields.forEach((f) => {
    const raw = draft[f.key];
    if (f.type === "number" || f.type === "decimal") {
      out[f.key] = raw === "" ? null : Number(raw);
    } else if (f.type === "checkbox") {
      out[f.key] = Boolean(raw);
    } else {
      out[f.key] = raw;
    }
  });
  return out;
}

export default function CrudTable({ resource, title, subtitle, fields }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(emptyFromFields(fields));
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .list(resource)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setDraft(emptyFromFields(fields));
    setEditingId(null);
    setError("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const startEdit = (row) => {
    const next = {};
    fields.forEach((f) => {
      next[f.key] = f.type === "password" ? "" : row[f.key];
    });
    setDraft(next);
    setEditingId(row.id);
  };

  const cancelEdit = () => {
    setDraft(emptyFromFields(fields));
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = coerce(fields, draft);

    if (editingId) {
      // não reenvia senha em branco na edição
      if ("senha" in payload && !payload.senha) delete payload.senha;
      await api
        .update(resource, editingId, payload)
        .then(() => {
          cancelEdit();
          load();
        })
        .catch((e) => setError(e.message));
    } else {
      await api
        .create(resource, payload)
        .then(() => {
          setDraft(emptyFromFields(fields));
          load();
        })
        .catch((e) => setError(e.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este registro?")) return;
    setError("");
    await api
      .remove(resource, id)
      .then(load)
      .catch((e) => setError(e.message));
  };

  return (
    <section className="panel">
      <header className="panel-head">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      {error && <div className="alert">{error}</div>}

      <form className="record-form" onSubmit={handleSubmit}>
        {fields.map((f) => (
          <label key={f.key} className={`field field-${f.type}`}>
            <span>{f.label}</span>
            {f.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={Boolean(draft[f.key])}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
              />
            ) : (
              <input
                type={f.type === "decimal" || f.type === "number" ? "number" : f.type}
                step={f.type === "decimal" ? "0.01" : undefined}
                placeholder={f.placeholder || ""}
                value={draft[f.key] ?? ""}
                required={f.required && !(editingId && f.type === "password")}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            )}
          </label>
        ))}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editingId ? "Salvar alterações" : "Adicionar"}
          </button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={cancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="hint">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="hint">Nenhum registro ainda. Use o formulário acima para adicionar o primeiro.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {fields
                .filter((f) => f.type !== "password")
                .map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
              <th className="col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                {fields
                  .filter((f) => f.type !== "password")
                  .map((f) => (
                    <td key={f.key}>
                      {f.type === "checkbox" ? (
                        <span className={`badge ${row[f.key] ? "badge-on" : "badge-off"}`}>
                          {row[f.key] ? "Ativo" : "Inativo"}
                        </span>
                      ) : (
                        String(row[f.key])
                      )}
                    </td>
                  ))}
                <td className="col-actions">
                  <button className="btn-link" onClick={() => startEdit(row)}>
                    Editar
                  </button>
                  <button className="btn-link btn-danger" onClick={() => handleDelete(row.id)}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
