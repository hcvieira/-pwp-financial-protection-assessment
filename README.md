# PWP Financial Protection Assessment — v1.1.0

Aplicação mobile-first/PWA para a PWP Wealth Solutions, baseada no mockup mobile aprovado e no BrandBook PWP 2026.

## O que está pronto

- Jornada pública mobile-first em 8 módulos.
- Banco adaptativo com mais de 65 definições de perguntas e ramificações condicionais.
- Perfis e ramificações específicas para empresário, dependentes, seguros existentes, sucessão e internacionalização.
- Motor determinístico para 8 pilares: Proteção de Renda, Proteção Familiar, Liquidez, Saúde, Patrimônio, Sucessão, Futuro e Diversificação Internacional.
- Cálculo de runway de liquidez, dependência de renda, gap mensal de renda e gap familiar indicativo.
- Relatório responsivo com score, pilares, insights, KPIs e simulações “E se...?”.
- Geração de PDF via impressão do navegador.
- CTA conectado ao WhatsApp oficial publicado pela PWP: +55 11 94544-4626.
- Captura de `?ref=CONSULTOR` para atribuição da origem.
- Captura de nome, e-mail, WhatsApp e cidade com consentimento.
- API própria de leads.
- Painel privado de consultor via `/#advisor`, quando `PWP_ADMIN_PIN` é configurado.
- Classificação interna A/B/C e exportação CSV.
- PWA instalável, service worker, ícones e preview social.
- Dockerfile e blueprint para hospedagem com disco persistente.
- Smoke test automatizado de servidor, API, persistência e configuração.

## Rodar

Requer Node.js 18+.

```bash
cd pwpapp
PWP_ADMIN_PIN='um-pin-privado-longo' node server.mjs
```

Abra `http://localhost:3000`.

A área do consultor fica em `http://localhost:3000/#advisor` e só é habilitada quando `PWP_ADMIN_PIN` é informado.

## Testar

```bash
npm test
```

O teste valida sintaxe, inicialização do servidor, página pública, gravação e leitura de lead, tamanho do banco de perguntas e WhatsApp oficial.

## Implantação

A aplicação pode ser executada em qualquer hospedagem que rode Node.js ou Docker. Para persistir leads, monte um volume e aponte `PWP_DATA_DIR` para ele. O arquivo `render.yaml` já descreve uma implantação com disco persistente; o `Dockerfile` permite uso em outros provedores.

Variáveis:

```env
PORT=3000
PWP_ADMIN_PIN=defina-um-pin-forte-e-privado
PWP_DATA_DIR=/data
```

## Arquivos principais

- `public/index.html` — shell, SEO/social/PWA.
- `public/app.js` — perguntas, ramificações, scoring, relatório e dashboard.
- `public/config.js` — contatos e URLs institucionais.
- `public/styles.css` — UI mobile e linguagem visual PWP.
- `server.mjs` — servidor HTTP, API e armazenamento de leads.
- `scripts/smoke.mjs` — teste automatizado.
- `Dockerfile` — container de produção.
- `render.yaml` — blueprint de deploy com disco persistente.

## Governança

O assessment é educacional e indicativo e não faz recomendação automática de produto. Antes de campanha em escala, a PWP deve validar juridicamente o texto de consentimento/política de privacidade e homologar internamente pesos, thresholds e fórmulas da metodologia. A aplicação já exibe avisos de escopo e evita coletar anamnese ou dados médicos detalhados no fluxo inicial.
