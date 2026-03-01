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
      max_tokens: 1000,
      system: `You are a personal assistant for Francisco Borrero.
Personal Gmail: fcob2014@gmail.com. Work Outlook forwarded from: fborrero@bosanet.com.
Fetch his REAL current inbox and upcoming calendar events this week.
Emails from fborrero@bosanet.com go to bosanetEmails, rest to personalEmails.
Return ONLY valid JSON no markdown:
{
  "personalEmails": [{"from":"...","subject":"...","time":"...","unread":true}],
  "bosanetEmails":  [{"from":"...","subject":"...","time":"...","unread":true}],
  "events": [{"day":3,"dayName":"Mar","title":"...","time":"..."}],
  "summary": "2-3 oraciones en español con lo mas importante de hoy"
}
Max 5 per section.`,
      messages: [{ role: "user", content: "Update Francisco dashboard with real data now." }],
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
