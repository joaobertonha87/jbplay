# JB Treinos Pro — pacote pronto para Render

Este pacote já está configurado para:
- GitHub
- Render Web Service
- HTTPS automático
- PWA no iPhone/iPad
- Backend Node.js/Express
- IA online via OpenAI
- variável secreta `OPENAI_API_KEY`

## 1) Subir para o GitHub

Crie um repositório novo no GitHub e envie **todo o conteúdo desta pasta**, incluindo:

- `public/`
- `server.js`
- `package.json`
- `render.yaml`
- `.gitignore`
- `.env.example`

Não envie nenhum arquivo `.env` com sua chave real.

## 2) Conectar ao Render

No Render:

1. Crie um novo **Web Service**.
2. Conecte sua conta do GitHub.
3. Escolha o repositório do JB Treinos Pro.
4. O Render deve detectar o `render.yaml`.

Configurações esperadas:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

## 3) Colocar a chave da IA

No painel do serviço no Render:

**Environment > Add Environment Variable**

Crie:

`OPENAI_API_KEY` = sua chave real da OpenAI

Opcional:
`OPENAI_MODEL` = `gpt-5-mini`

Nunca coloque a chave dentro do `index.html` ou em arquivos públicos.

## 4) Abrir o aplicativo

Depois do deploy, o Render fornecerá um endereço parecido com:

`https://jb-treinos-pro.onrender.com`

Abra esse endereço no Safari do iPhone/iPad.

Depois:
**Compartilhar > Adicionar à Tela de Início**

Assim o JB Treinos Pro será instalado como PWA.

## 5) Teste rápido

Abra no navegador:

`/health`

Exemplo:
`https://SEU-ENDERECO.onrender.com/health`

Deve retornar algo como:
`{"ok":true,"app":"JB Treinos Pro"}`

## 6) Estrutura

```text
JB_Treinos_Pro_Render_Ready/
├── public/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── jb-logo.jpeg
│   ├── icon-192.png
│   └── icon-512.png
├── server.js
├── package.json
├── render.yaml
├── .gitignore
├── .env.example
└── README_RENDER.md
```

## Observação sobre o plano gratuito

Em planos gratuitos, o serviço pode entrar em suspensão após um período sem uso e demorar alguns segundos para responder no primeiro acesso. Para uso diário em aula, um plano pago reduz esse atraso.


## Correção do deploy no Render

Esta versão corrige a rota coringa incompatível com Express 5.

Depois de atualizar o GitHub:
1. Abra **Deploys** no Render.
2. Clique em **Deploy latest commit**.
3. Aguarde o status ficar **Live**.
4. Teste `/health`.
