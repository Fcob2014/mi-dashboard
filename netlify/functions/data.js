
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
    // Run both calls in parallel: dashboard data + Excel payments
    const [dashData, payData] = await Promise.all([
      callDashboardAPI(),
      callPaymentsAPI()
    ]);

    const response = Object.assign({}, dashData, { payments: payData });
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Dashboard: emails + calendar ──────────────────────
function callDashboardAPI() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are a personal assistant for Francisco Borrero.
Personal Gmail: fcob2014@gmail.com. Work emails from: fborrero@bosanet.com.
Fetch his REAL current inbox and upcoming calendar events this week.
Emails from fborrero@bosanet.com go to bosanetEmails, rest to personalEmails.
Return ONLY valid JSON, no markdown:
{
  "personalEmails": [{"from":"...","subject":"...","time":"...","unread":true,"priority":"high|medium|low","action":"..."}],
  "bosanetEmails":  [{"from":"...","subject":"...","time":"...","unread":true,"priority":"high|medium|low","action":"..."}],
  "events": [{"day":3,"dayName":"Mar","title":"...","time":"..."}],
  "alerts": [{"type":"urgent|warning|opportunity|reminder","icon":"...","title":"...","detail":"..."}],
  "priorities": [{"rank":1,"task":"...","reason":"...","category":"..."}],
  "briefing": "2-3 oraciones en español con lo mas importante de hoy"
}
Max 5 per section.`,
      messages: [{ role: "user", content: "Update Francisco dashboard with real data now." }],
      mcp_servers: [
        { type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" },
        { type: "url", url: "https://gcal.mcp.claude.com/mcp", name: "google-calendar" }
      ]
    });

    callAPI(body, resolve, reject);
  });
}

// ── Payments: read Excel from Gmail attachment ─────────
function callPaymentsAPI() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a financial data extractor for Francisco Borrero.

TASK: Search Gmail for the most recent email with subject containing "DASHBOARD UPDATE" sent to fcob2014@gmail.com. It will have an Excel file attached (.xlsx).

Read the attachment. Go to the sheet "Semanal USA". Find the current month columns (MAR 2026 = cols starting at Excel column index ~495).

The structure per month is:
- 4 weekly columns (Semana 1, 2, 3, 4)  
- 1 PAY column at the end

PAY column rules (THIS IS THE KEY):
- Cell = "NO"  → NOT paid yet
- Cell = a number > 0 → PAID (that is the amount paid)
- Cell = 0 or empty → skip

For each expense row that has PAY = "NO" or a number, also read:
- Column A = expense name (label)
- The number in parentheses in the label = day of month when payment is due (e.g. "CASA WESTON (11)" = due day 11)
- Amount = value in the first non-zero weekly column

Return ONLY valid JSON, no markdown:
{
  "month": "MAR 2026",
  "updated": "ISO timestamp of email",
  "expenses": [
    {
      "label": "expense name cleaned",
      "amount": 352.94,
      "day": 1,
      "paid": false
    }
  ]
}

If no email found, return: {"month": null, "updated": null, "expenses": []}`,
      messages: [{ role: "user", content: "Find the DASHBOARD UPDATE email and extract payment data from the Excel attachment now." }],
      mcp_servers: [
        { type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" }
      ]
    });

    callAPI(body, (data) => {
      // data might be the full dashboard response or just payments
      resolve(data.expenses ? data : { month: null, updated: null, expenses: [] });
    }, () => {
      // If payments fail, return empty so dashboard still works
      resolve({ month: null, updated: null, expenses: [] });
    });
  });
}

// ── Shared HTTP caller ────────────────────────────────
function callAPI(body, resolve, reject) {
  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "mcp-client-2025-04-04",
      "Content-Length": Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        const text = parsed.content?.find(b => b.type === "text")?.text || "{}";
        const clean = text.replace(/```json|```/g, "").trim();
        resolve(JSON.parse(clean));
      } catch {
        reject(new Error("Parse error: " + data.slice(0, 200)));
      }
    });
  });

  req.on("error", reject);
  req.write(body);
  req.end();
}
