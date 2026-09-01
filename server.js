import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use((req,res,next)=>{
  if (/\.(?:html|js|webmanifest)$/i.test(req.path) || req.path === "/" || req.path === "/sw.js") {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});
app.use(express.static(path.join(__dirname, "public"), { index: "index.html", etag: false }));

app.get("/health", (_req, res) => res.json({ ok: true, app: "JB Play Aula na Mão V37.0", ai: !!client, aulaNaMaoImport: true, autoExpandBlocks: true, singleFundamental: true, staticTacticalBoards: true }));

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

app.get("/api/ai-status", (_req, res) => {
  res.json({
    online: !!client,
    model,
    provider: "OpenAI",
    mode: "online-only",
    version: "16.4"
  });
});

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


MOTOR INTELIGENTE DE PRESCRIÇÃO V16.6:
- Converta a prescrição em uma sequência executável, não em explicação.
- Cada toque na bola deve ser uma etapa da timeline.
- O destino de uma bola deve coincidir com o ponto de contato do próximo jogador quando targetPlayer existir.
- "paralela": mantém a coluna/lado da quadra (Aluno 1↔Aluno 3; Aluno 2↔Aluno 4).
- "cruzada": cruza a coluna (Aluno 1↔Aluno 4; Aluno 2↔Aluno 3).
- "central": use targetLane Central/Zona 3, sem trocar a identidade dos jogadores.
- Se o professor lançar para um aluno, actor=Professor e targetPlayer deve ser esse aluno.
- Se o professor disser "parado", não crie deslocamento nem contactZone artificial.
- Se especificar linha de 3 m, use Zona verde; linha de 6 m, use Zona amarela; fundo/8 m, use Zona vermelha.
- Para bola viva/contínuo, cada targetPlayer deve ser o actor da próxima etapa sempre que houver recebedor.
- Para lob/rainbow, trajectory.type=arco alto e speed entre 0.75 e 1.05.
- Para smash, trajectory.type=descendente e speed entre 1.5 e 2.0.
- Para curta, trajectory.type=curta e targetZone=Zona verde.
- Para voleios/forehands/backhands normais, use reta ou arco baixo conforme a descrição.
- Preserve literalmente a ordem pedida pelo professor.
- SINCRONIZAÇÃO: o deslocamento do recebedor deve acontecer DURANTE o voo da bola anterior e terminar no ponto de contato; não crie uma etapa separada só para esse deslocamento.
- Se a próxima etapa já tiver contactZone, essa zona é a posição FINAL de contato. Não some outro recuo/avanço além dela.
- Quando o texto disser "zona 3 para alunos 3 e 4" ou equivalente, interprete Zona 3 como corredor/alvo central entre os dois: targetPlayer="", targetLane="Zona 3"; não escolha arbitrariamente um dos dois.
- Quando a prescrição terminar com "ponto livre", "jogo livre" ou equivalente, adicione uma última etapa com action="Ponto livre", sem inventar golpes posteriores. O simulador encerrará a sequência dirigida nesse marcador.
- Para gancho paralelo, preserve a coluna do executor e do alvo indicado; trajectory.type deve ser arco baixo ou descendente conforme altura, nunca lob alto.
- Para defesa de gancho com avanço à rede, a etapa do defensor deve ter movement.type="avanço" e o ponto de contato deve ficar na Zona verde, salvo instrução contrária.
- Não acrescente golpes que não foram pedidos, exceto quando a prescrição solicitar treino aberto/bola viva e precisar de continuidade.
- Se houver ambiguidade, escolha a interpretação mais conservadora e registre em warnings.
- Inclua confidence de 0 a 1 para a interpretação global.
- V16.6: defina contactHeight como baixa/média/alta conforme o golpe; Lob/Rainbow/Smash/Gancho/Bandeja normalmente exigem contato alto quando coerente.
- V16.6: use preparation para descrever a preparação técnica do jogador antes do contato (ex.: "giro de ombros", "raquete alta", "base baixa").
- V16.6: use group para sincronização. Etapas independentes que devem ocorrer ao mesmo tempo recebem o MESMO group; ações sequenciais recebem groups crescentes.
- V16.6: delayMs permite pequeno atraso dentro do mesmo group, de 0 a 2500 ms.
- No modo Simultâneo, procure pares de ações independentes executáveis em paralelo sem criar duas bolas incompatíveis para o mesmo jogador.

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
 "confidence":0.95,
 "warnings":["string"],
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
     "speed":1.2,
     "contactHeight":"baixa|média|alta",
     "preparation":"string",
     "group":1,
     "delayMs":0
   }
 ]
}
`;

const TRAINING_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    title:{type:"string"}, level:{type:"string",enum:["Iniciante","Intermediário","Avançado"]}, players:{type:"integer",enum:[2,3,4]},
    mode:{type:"string",enum:["Sequencial","Simultâneo","Contínuo / bola viva"]},
    focus:{type:"string",enum:["Construção de ponto","Definição","Recuperação","Transição ataque/defesa","Direcionamento","Volume / intensidade"]},
    direction:{type:"string",enum:["Zona 1","Zona 2","Zona 3","Zona 4","Zona 5","Cruzado","Paralela","Central"]},
    shots:{type:"array",items:{type:"string"}}, objective:{type:"string"}, notes:{type:"string"}, confidence:{type:"number",minimum:0,maximum:1}, warnings:{type:"array",items:{type:"string"}},
    timeline:{type:"array",minItems:1,maxItems:24,items:{type:"object",additionalProperties:false,properties:{
      actor:{type:"string",enum:["Professor","Aluno 1","Aluno 2","Aluno 3","Aluno 4"]}, action:{type:"string"},
      contactZone:{type:"string",enum:["","Zona verde","Zona amarela","Zona vermelha"]}, contactLane:{type:"string",enum:["","Esquerda","Direita","Central","Zona 1","Zona 2","Zona 3","Zona 4","Zona 5"]},
      targetPlayer:{type:"string",enum:["","Aluno 1","Aluno 2","Aluno 3","Aluno 4"]}, targetZone:{type:"string",enum:["","Zona verde","Zona amarela","Zona vermelha"]}, targetLane:{type:"string",enum:["","Paralela","Cruzada","Central","Esquerda","Direita","Zona 1","Zona 2","Zona 3","Zona 4","Zona 5"]},
      recoveryZone:{type:"string",enum:["","Zona verde","Zona amarela","Zona vermelha"]}, recoveryLane:{type:"string",enum:["","Esquerda","Direita","Central"]},
      movement:{type:"object",additionalProperties:false,properties:{type:{type:"string",enum:["parado","aproximação","lateral","recuo","avanço","recuperação"]},direction:{type:"string",enum:["","esquerda","direita","frente","fundo"]}},required:["type","direction"]},
      trajectory:{type:"object",additionalProperties:false,properties:{type:{type:"string",enum:["reta","arco baixo","arco alto","curta","descendente"]},curve:{type:"number",minimum:-180,maximum:90}},required:["type","curve"]}, speed:{type:"number",minimum:.55,maximum:2.2}, contactHeight:{type:"string",enum:["baixa","média","alta"]}, preparation:{type:"string"}, group:{type:"integer",minimum:1,maximum:24}, delayMs:{type:"integer",minimum:0,maximum:2500}
    },required:["actor","action","contactZone","contactLane","targetPlayer","targetZone","targetLane","recoveryZone","recoveryLane","movement","trajectory","speed","contactHeight","preparation","group","delayMs"]}}
  },
  required:["title","level","players","mode","focus","direction","shots","objective","notes","confidence","warnings","timeline"]
};

const LESSON_SYSTEM = `
Você é o planejador de aulas JB Aula Inteligente, do professor João Bertonha, especialista em Beach Tennis.
Crie uma aula prática, segura, objetiva e aplicável na quadra, usando a nomenclatura informada pelo professor.
Adapte a organização para 1 a 12 alunos. Com mais de quatro alunos, use rodízio, estações ou filas curtas, mantendo no máximo quatro jogadores ativos por sequência.
O plano deve ter exatamente cinco blocos: Aquecimento, Exercício técnico, Situação técnico/tática, Jogo condicionado e Fechamento.
A soma dos minutos dos cinco blocos deve ser exatamente a duração solicitada.
Cada bloco deve explicar organização, execução, volume/rodízio e foco de correção de forma concisa.
Não invente equipamentos especiais. Use professor, alunos, bolas, cesto, cones e quadra quando necessário.
Responda somente em JSON válido segundo o schema.
`;

const LESSON_SCHEMA = {
  type:"object",additionalProperties:false,
  properties:{
    title:{type:"string"},objective:{type:"string"},teacherTips:{type:"array",items:{type:"string"},maxItems:6},
    blocks:{type:"array",minItems:5,maxItems:5,items:{type:"object",additionalProperties:false,properties:{
      title:{type:"string"},minutes:{type:"integer",minimum:1,maximum:120},text:{type:"string"}
    },required:["title","minutes","text"]}}
  },required:["title","objective","teacherTips","blocks"]
};

function normalizeLesson(plan,duration){
  if(!plan||!Array.isArray(plan.blocks)||plan.blocks.length!==5)throw new Error("Plano de aula incompleto.");
  const total=plan.blocks.reduce((sum,b)=>sum+(Number(b.minutes)||0),0);
  if(total!==duration){
    const diff=duration-total;
    plan.blocks[3].minutes=Math.max(1,(Number(plan.blocks[3].minutes)||1)+diff);
  }
  return plan;
}

function validateTrainingPlan(plan){
  if(!plan||!Array.isArray(plan.timeline)||!plan.timeline.length) throw new Error("Resposta da IA sem timeline executável.");
  plan.timeline=plan.timeline.slice(0,24).map((step,i)=>({...step,order:i+1,speed:Math.max(.55,Math.min(2.2,Number(step.speed)||1.1))}));
  return plan;
}

app.post("/api/generate-training", async (req, res) => {
  const started = Date.now();
  try {
    console.log("JB PLAY IA: requisicao recebida");
    const { prompt, context } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Prompt ausente." });
    if (!client) return res.status(503).json({ error: "OPENAI_API_KEY nao configurada no servidor." });

    console.log("JB PLAY IA: chave encontrada - chamando OpenAI...");
    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Pedido do professor: ${prompt}\nContexto atual: ${JSON.stringify(context || {})}` }
      ],
      text: { format: { type: "json_schema", name: "jb_play_training", strict: true, schema: TRAINING_SCHEMA } }
    }, { timeout: 90000, maxRetries: 0 });

    console.log(`JB PLAY IA: resposta recebida da OpenAI em ${Date.now()-started}ms`);
    const text = (response.output_text || "").trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/," ").trim();
    const plan = validateTrainingPlan(JSON.parse(clean));
    plan.meta = { source: "openai", model, latencyMs: Date.now()-started, schema: "jb-prescription-v16.6" };
    res.json(plan);
  } catch (err) {
    console.error("JB PLAY IA ERRO:", err?.status || "", err?.name || "Error", err?.message || err);
    const status = err?.status || (err?.name === "APIConnectionTimeoutError" ? 504 : 500);
    let error = "Falha ao gerar treino com IA online.";
    if (status === 401) error = "Chave da OpenAI inválida ou não autorizada.";
    else if (status === 429) error = "Limite/quota da OpenAI atingido. Verifique créditos e limites do projeto.";
    else if (status === 404) error = `Modelo ${model} indisponível para esta chave/projeto.`;
    else if (status === 504) error = "A OpenAI excedeu o tempo máximo de resposta.";
    res.status(status).json({
      error,
      type: err?.name || "Error",
      message: err?.message || "Erro desconhecido",
      model
    });
  }
});

app.post("/api/generate-lesson", async (req,res)=>{
  const started=Date.now();
  try{
    const {config,students,scout}=req.body||{};
    const duration=Math.max(30,Math.min(120,Number(config?.duration)||60));
    if(!config?.fundamentals?.length)return res.status(400).json({error:"Selecione ao menos um fundamento."});
    if(!client)return res.status(503).json({error:"OPENAI_API_KEY nao configurada no servidor."});
    const request={...config,duration,students:(students||[]).slice(0,12),scout:scout||null};
    const response=await client.responses.create({
      model,
      input:[{role:"system",content:LESSON_SYSTEM},{role:"user",content:`Configuração da aula: ${JSON.stringify(request)}`}],
      text:{format:{type:"json_schema",name:"jb_lesson_plan",strict:true,schema:LESSON_SCHEMA}}
    },{timeout:90000,maxRetries:0});
    const clean=(response.output_text||"").trim().replace(/^```json\s*/i,"").replace(/```$/," ").trim();
    const plan=normalizeLesson(JSON.parse(clean),duration);
    plan.meta={source:"openai",model,latencyMs:Date.now()-started,schema:"jb-lesson-v1"};
    res.json(plan);
  }catch(err){
    console.error("JB AULA IA ERRO:",err?.status||"",err?.message||err);
    const status=err?.status||(err?.name==="APIConnectionTimeoutError"?504:500);
    res.status(status).json({error:status===504?"A IA excedeu o tempo máximo.":"Falha ao gerar a aula com IA.",message:err?.message||"Erro desconhecido",model});
  }
});

app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`JB Play Aula na Mão V37.0 em http://0.0.0.0:${port}`));
