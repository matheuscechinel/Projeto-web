Back-end


cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
DATABASE_URL=postgresql+psycopg2://postgres:SUASENHA@localhost:5432/app_comprass

uvicorn app.main:app --reload --port 8000


A API sobe em `http://localhost:8000`

Rotas disponíveis (mesmo padrão para os três recursos):

| Método | Rota                  | Ação            |
|--------|-----------------------|-----------------|
| GET    | `/fornecedores`       | listar          |
| POST   | `/fornecedores`       | criar           |
| PUT    | `/fornecedores/{id}`  | atualizar       |
| DELETE | `/fornecedores/{id}`  | remover         |

O mesmo vale para `/produtos` e `/listas`.

Front-end

cd frontend
npm install
npm run dev

Abre em `http://localhost:5173`. Por padrão ele chama a API em
`http://localhost:8000`.
