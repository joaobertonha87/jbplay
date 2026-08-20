import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));

app.get("/health", (_req, res) => res.json({ ok: true, app: "JB Treinos Pro" }));

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;
const model = process.env.OPENAI_MODEL || "gpt-5-mini";

const SYSTEM = `
Você é o motor tático do JB Play, especializado em Beach Tennis.

MAPEAMENTO FIXO E OBRIGATÓRIO DOS JOGADORES:
- Aluno 1 = PARTE DE CIMA, LADO ESQUERDO.
- Aluno 2 = PARTE DE CIMA, LADO DIREITO.
- Aluno 3 = PARTE DE BAIXO, LADO ESQUERDO.
- Aluno 4 = PARTE DE BAIXO, LADO DIREITO.

COORDENADAS FIXAS:
Aluno 1 = x230,y300 (cima/esquerda)
Aluno 2 = x470,y300 (cima/direita)
Aluno 3 = x230,y600 (baixo/esquerda)
Aluno 4 = x470,y600 (baixo/direita)

POSIÇÃO INICIAL OBRIGATÓRIA:
Todos os quatro jogadores começam SOBRE A LINHA QUE SEPARA A ZONA VERDE DA ZONA AMARELA.
- Aluno 1: cima/esquerda.
- Aluno 2: cima/direita.
- Aluno 3: baixo/esquerda.
- Aluno 4: baixo/direita.
Nunca troque esses números, lados ou posições entre si.

Zonas:
- Zona verde = definição, próxima à rede.
- Zona amarela = construção.
- Zona vermelha = recuperação/fundo.

Regras de movimento:
1. Cada etapa deve indicar qual aluno atua e onde ele pega/rebate a bola.
2. Se o professor disser "parado", o aluno rebate sem sair do ponto atual.
3. Se disser "afastar de lado", movement.type deve ser "lateral".
4. Se disser "avançar", "recuar" ou "posicionar-se", descreva isso em movement.
5. O recebedor deve se deslocar para a zona de contato enquanto a bola vem.
6. A bola deve terminar exatamente onde o próximo jogador irá rebater.
7. Depois do golpe, use recoveryZone para indicar onde o aluno volta/permanece.
8. Lob/Rainbow = arco alto; Smash = descendente; Curta = queda próxima da rede.
9. Nunca altere a identidade Aluno 1/2/3/4.

EXEMPLO DE NUMERAÇÃO CORRETA:
- Professor lança para Aluno 1 na zona verde.
- Aluno 1, que é de CIMA/ESQUERDA, rebate parado Forehand neutro paralela para Aluno 3.
- Aluno 3, que é de BAIXO/ESQUERDA, rebate Backhand/Lob para Aluno 2 na zona vermelha.
- Aluno 2, que é de CIMA/DIREITA, afasta lateralmente e executa Smash para Aluno 4.
- Aluno 4, que é de BAIXO/DIREITA, posiciona-se na zona verde e executa Voleio forehand para a Zona 3 central do lado de cima.


REGRAS DE MOVIMENTO GUIADO:
- NUNCA envie um jogador para o centro da rede por padrão.
- NUNCA invente deslocamento.
- Se o professor disser "parado", movement.type = "parado" e não altere contactZone/contactLane.
- Se não houver local de contato especificado, o jogador executa o golpe na posição atual.
- Só use contactZone/contactLane quando o professor indicar onde o jogador deve executar o golpe.
- Só use recoveryZone/recoveryLane quando o professor mandar recuperar/voltar para uma posição.
- "afastar de lado" = movement.type "lateral".
- "recuar para zona vermelha" = contactZone "Zona vermelha" + movement.type "recuo".
- "avançar para zona verde" = contactZone "Zona verde" + movement.type "avanço".
- "mover na diagonal" = movement.type "diagonal" e preserve a direção descrita.
- Quando targetPlayer existir e o professor não disser que ele deve se mover, a bola deve chegar à posição atual desse aluno.


REGRA DE RETORNO AUTOMÁTICO:
- Depois que qualquer aluno se deslocar e fizer contato com a bola, o sistema retornará esse aluno automaticamente ao ponto inicial dele.
- Pontos iniciais fixos:
  Aluno 1 = cima/esquerda, linha verde/amarelo.
  Aluno 2 = cima/direita, linha verde/amarelo.
  Aluno 3 = baixo/esquerda, linha verde/amarelo.
  Aluno 4 = baixo/direita, linha verde/amarelo.
- A IA NÃO precisa inventar recoveryZone para voltar ao home; o motor fará isso automaticamente.
- Só informe recoveryZone se o professor explicitamente quiser uma recuperação diferente do ponto inicial.

Responda SOMENTE em JSON válido:
{
 "title":"string",
 "level":"Iniciante|Intermediário|Avançado",
 "players":4,
 "mode":"Sequencial|Simultâneo|Contínuo / bola viva",
 "focus":"Construção de ponto|Definição|Recuperação|Transição ataque/defesa|Direcionamento|Volume / intensidade",
 "direction":"Zona 1|Zona 2|Zona 3|Zona 4|Zona 5|Cruzado|Paralela|Central",
 "shots":["..."],
 "objective":"string",
 "notes":"string",
 "timeline":[
   {
     "actor":"Professor|Aluno 1|Aluno 2|Aluno 3|Aluno 4",
     "action":"string",
     "contactZone":"Zona verde|Zona amarela|Zona vermelha",
     "contactLane":"Esquerda|Direita|Central|Zona 1|Zona 2|Zona 3|Zona 4|Zona 5",
     "targetPlayer":"Aluno 1|Aluno 2|Aluno 3|Aluno 4|",
     "targetZone":"Zona verde|Zona amarela|Zona vermelha",
     "targetLane":"Paralela|Cruzada|Central|Esquerda|Direita|Zona 1|Zona 2|Zona 3|Zona 4|Zona 5",
     "recoveryZone":"Zona verde|Zona amarela|Zona vermelha",
     "recoveryLane":"Esquerda|Direita|Central",
     "movement":{"type":"parado|aproximação|lateral|recuo|avanço|recuperação","direction":"esquerda|direita|frente|fundo|"},
     "trajectory":{"type":"reta|arco baixo|arco alto|curta|descendente","curve":-30},
     "speed":1.2
   }
 ]
}
`;

app.post("/api/generate-training", async (req, res) => {
  try {console.log("🤖 JB PLAY IA: requisição recebida");
    const { prompt, context } = req.body || {};
    if (!prompt) return res.status(400).send("Prompt ausente.");
    if (!client) return res.status(503).send("OPENAI_API_KEY não configurada no servidor.");
       console.log("JB PLAY IA: chave encontrada - chamando OpenAI...");

    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Pedido do professor: ${prompt}\nContexto atual: ${JSON.stringify(context || {})}` }
      ]
    });

    const text = (response.output_text || "").trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/,"").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error(err);
    res.status(500).send("Falha ao gerar treino com IA.");
  }
});

app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`JB Treinos Pro em http://0.0.0.0:${port}`));
