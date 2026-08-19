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
Gere exercícios executáveis, coerentes com trajetória da bola, movimentação, contato e recuperação.

Golpes permitidos:
Voleio forehand, Voleio backhand, Forehand neutro, Forehand acelerado, Backhand neutro, Backhand,
Smash, Gancho, Lob, Curta, Bandeja, Rainbow, Anômalo, Saque.

Regras:
- A bola deve cruzar a rede em trocas entre lados.
- Smash: trajetória mais direta/descendente.
- Lob e Rainbow: arco alto.
- Curta: queda próxima da rede.
- Gancho: recuperação/defesa de bola alta.
- Após o golpe, prever recuperação coerente.
- Em bola viva, distribuir ações entre os alunos.
- Gere entre 6 e 14 etapas.

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
 "player_positions":[{"player":"Aluno 1","x":230,"y":690}],
 "timeline":[
   {
     "actor":"Professor|Aluno 1|Aluno 2|Aluno 3|Aluno 4",
     "action":"Lançamento|nome do golpe|Avanço|Corrida",
     "target":"Aluno 1|Aluno 2|Aluno 3|Aluno 4|Zona 1|Zona 2|Zona 3|Zona 4|Zona 5|Cruzado|Paralela|Central|Zona de definição|Zona de construção|Zona de recuperação",
     "speed":1.2,
     "movement":{"type":"aproximação|recuo|lateral|recuperação","intensity":1.0},
     "trajectory":{"type":"reta|arco baixo|arco alto|curta|descendente","curve":-30}
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
