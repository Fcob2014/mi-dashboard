const https = require("https");

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const response = await callAnthropicAPI();
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function callAnthropicAPI() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `Eres el asistente ejecutivo personal de Francisco Borrero, dueño de Bosanet LLC.
Tu trabajo es analizar sus correos y calendario y darle inteligencia real, no solo información.

CONTEXTO DE FRANCISCO:
- Personal Gmail: fcob2014@gmail.com
- Trabajo Outlook (reenviado): fborrero@bosanet.com  
- Tiene vuelo a LAX el 3 de Marzo (Expo West) y regresa el 6 de Marzo
- Empresa: Bosanet LLC - empresa de tecnología/logística con productos BosaPay, BosaBox, BosaExpress
- Temas urgentes conocidos: Score de crédito, pagos pendientes (carro $20k, LNV $9k), American Express, Trust, Experian
- Inversores activos: Lucio ($15k), Juan Gomez (SAFE), varios prospectos
- Preocupaciones de negocio: BosaPay excepciones $30, registro de marcas, taxes Colombia

INSTRUCCIONES:
1. Lee los correos reales de Gmail de ambas cuentas
2. Lee los eventos del calendario de esta semana
3. Analiza TODO con inteligencia ejecutiva
4. Identifica: urgencias, oportunidades, riesgos, recordatorios de viaje

Devuelve SOLO JSON válido, sin markdown:
{
  "personalEmails": [{"from":"...","subject":"...","time":"...","unread":true,"priority":"high/medium/low","action":"qué debe hacer Francisco con este email"}],
  "bosanetEmails": [{"from":"...","subject":"...","time":"...","unread":true,"priority":"high/medium/low","action":"qué debe hacer Francisco con este email"}],
  "events": [{"day":3,"dayName":"Mar","title":"...","time":"..."}],
  "alerts": [
    {"type":"urgent","icon":"🚨","title":"título corto","detail":"explicación de por qué es urgente y qué hacer"},
    {"type":"warning","icon":"⚠️","title":"título corto","detail":"explicación"},
    {"type":"opportunity","icon":"💡","title":"título corto","detail":"explicación"},
    {"type":"reminder","icon":"✈️","title":"título corto","detail":"explicación"}
  ],
  "priorities": [
    {"rank":1,"task":"La tarea MÁS importante de hoy","reason":"por qué es la #1","category":"personal/bosanet/finanzas"},
    {"rank":2,"task":"Segunda tarea más importante","reason":"por qué","category":"..."},
    {"rank":3,"task":"Tercera tarea","reason":"por qué","category":"..."},
    {"rank":4,"task":"Cuarta tarea","reason":"por qué","category":"..."},
    {"rank":5,"task":"Quinta tarea","reason":"por qué","category":"..."}
  ],
  "briefing": "Párrafo ejecutivo de 3-4 oraciones en español: qué pasó hoy, qué es crítico, qué oportunidad no debe perder Francisco"
}
Máximo 5 emails por cuenta. Las alertas deben ser REALES basadas en los correos, no genéricas.`,
      messages: [{ role: "user", content: "Dame el briefing ejecutivo completo de hoy para Francisco." }],
      mcp_servers: [
        { type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" },
        { type: "url", url: "https://gcal.mcp.claude.com/mcp", name: "google-calendar" }
      ]
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.find(b => b.type === "text")?.text || "";
          const clean = text.replace(/```json|```/g, "").trim();
          resolve(JSON.parse(clean));
        } catch {
          reject(new Error("Parse error"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
