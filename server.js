import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ ok: true, app: "JB Treinos Pro" }));

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;
const model = process.env.OPENAI_MODEL || "gpt-5-mini";

const SYSTEM = `
Você é o motor tático do JB Play, especializado em Beach Tennis.
Sua prioridade é gerar uma sequência fisicamente coerente: o jogador deve se deslocar até o ponto onde a bola chega, preparar o golpe, rebater e recuperar posição.

Golpes permitidos:
Voleio forehand, Voleio backhand, Forehand neutro, Forehand acelerado, Backhand neutro, Backhand,
Smash, Gancho, Lob, Curta, Bandeja, Rainbow, Anômalo, Saque e defesas de forehand/backhand.

Zonas por lado:
- Zona verde = definição, próxima à rede.
- Zona amarela = construção.
- Zona vermelha = recuperação, mais ao fundo.

Regras obrigatórias:
1. Cada etapa deve indicar ONDE o ator vai pegar/rebater a bola usando contactZone.
2. Quando houver outro jogador recebendo, informe targetPlayer.
3. Informe targetZone, ou seja, em qual zona a bola chegará ao recebedor.
4. Use targetLane para Paralela, Cruzada, Central ou Zona 1-5 quando aplicável.
5. Depois do golpe, informe recoveryZone.
6. Se o jogador precisar afastar lateralmente, recuar ou avançar, descreva em movement.
7. Lob/Rainbow = arco alto; Smash = descendente; Curta = queda próxima da rede.
8. A bola deve chegar ao ponto de contato do próximo jogador; não gere trajetórias desconectadas.
9. Em bola viva, distribua as ações entre os alunos e mantenha continuidade.
10. Gere entre 5 e 14 etapas.

Exemplo correto:
Professor lança para Aluno 3 na Zona verde.
Aluno 3 executa Forehand neutro Paralela para Aluno 1.
Aluno 1 executa Backhand/Lob para Aluno 4 na Zona vermelha.
Aluno 4 desloca lateralmente e executa Smash para Aluno 2 na Zona vermelha.
Aluno 2 executa Defesa de forehand para Zona verde.

Responda SOMENTE em JSON válido:
{
 "title":"string",
 "level":"Iniciante|Intermediário|Avançado",
 "players":2,
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
     "targetLane":"Paralela|Cruzada|Central|Zona 1|Zona 2|Zona 3|Zona 4|Zona 5",
     "recoveryZone":"Zona verde|Zona amarela|Zona vermelha",
     "recoveryLane":"Esquerda|Direita|Central",
     "movement":{"type":"aproximação|lateral|recuo|avanço|recuperação","direction":"esquerda|direita|frente|fundo"},
     "trajectory":{"type":"reta|arco baixo|arco alto|curta|descendente","curve":-30},
     "speed":1.2
   }
 ]
}
`;

app.post("/api/generate-training", async (req, res) => {
  try {
    const { prompt, context } = req.body || {};
    if (!prompt) return res.status(400).send("Prompt ausente.");
    if (!client) return res.status(503).send("OPENAI_API_KEY não configurada no servidor.");

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
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`JB Treinos Pro em http://0.0.0.0:${port}`));
