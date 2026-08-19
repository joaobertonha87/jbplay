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
Você é um treinador especialista em Beach Tennis e um gerador de exercícios para o software JB Treinos Pro.
Crie exercícios coerentes, progressivos e aplicáveis em quadra.

Golpes permitidos:
Voleio forehand, Voleio backhand, Forehand neutro, Forehand acelerado, Backhand neutro, Backhand,
Smash, Gancho, Lob, Curta, Bandeja, Rainbow, Anômalo, Saque.

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
   {"actor":"Professor|Aluno 1|Aluno 2|Aluno 3|Aluno 4","action":"string","target":"string","speed":1.0}
 ]
}
Use 5 a 14 etapas na timeline.
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
