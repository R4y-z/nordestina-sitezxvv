# Setup Rápido

## Pré-requisitos
- Node.js 18+
- pnpm 8+
- PostgreSQL 16 (ou Docker)

## 1. Banco de dados (com Docker)
```bash
docker-compose up -d postgres
```

## 2. Configurar variáveis de ambiente
As variáveis já estão configuradas nos arquivos:
- `apps/api/.env`
- `apps/web/.env.local`
- `apps/store/.env.local`

## 3. Instalar dependências
```bash
pnpm install --ignore-scripts
```

## 4. Gerar cliente Prisma + Migrar banco
```bash
pnpm db:generate
pnpm db:migrate
```

## 5. Seed (dados iniciais)
```bash
pnpm db:seed
```
Isso cria:
- Usuário admin: admin@saborzone.com / admin123
- Usuário caixa: caixa@saborzone.com / caixa123
- Categorias, produtos e mesas de exemplo

## 6. Iniciar em desenvolvimento
```bash
pnpm dev
```
- **API**: http://localhost:3000
- **Admin**: http://localhost:3001 (porta na config `apps/web`)
- **Loja**: http://localhost:3002 (porta na config `apps/store`)
- **Swagger**: http://localhost:3000/api/docs

## Portas
| App       | Porta |
|-----------|-------|
| API       | 3000  |
| Admin     | 3001  |
| Loja      | 3002  |

> Ajuste as portas em `apps/web/package.json` e `apps/store/package.json` se necessário.
