import { useState, useEffect, useCallback } from "react";

const PERSONAL_NOTES = [
  { id: 1, section: "Varios USA", text: "William Fodge", tag: "general", done: false },
  { id: 2, section: "Varios USA", text: "Revisar Seguro de la Casa", tag: "urgente", done: false },
  { id: 3, section: "Varios USA", text: "Revisar seguro de Geico", tag: "urgente", done: false },
  { id: 4, section: "Varios USA", text: "Finance Services Calentador", tag: "general", done: false },
  { id: 5, section: "Varios USA", text: "Score Mamá: Colchón", tag: "general", done: false },
  { id: 6, section: "Varios USA", text: "Hacer el Trust", tag: "urgente", done: false },
  { id: 7, section: "Personal", text: "Contabilidad Dubo", tag: "general", done: false },
  { id: 8, section: "Personal", text: "Cambia clave Apple", tag: "general", done: false },
  { id: 9, section: "Personal", text: "Llamar Experian", tag: "urgente", done: false },
  { id: 10, section: "Personal", text: "Cancelar Experian", tag: "urgente", done: false },
  { id: 11, section: "Pagos Score", text: "Pagar el Carro $20k", tag: "finance", done: false },
  { id: 12, section: "Pagos Score", text: "Pagar LNV Funding $9k", tag: "finance", done: false },
  { id: 13, section: "Trámites", text: "Ventanas Impacto 1-800-641-2754", tag: "general", done: false },
  { id: 14, section: "Trámites", text: "BOA – TC y Refinanciar carro", tag: "finance", done: false },
  { id: 15, section: "Trámites", text: "American Express 20 días 800-700-7619", tag: "urgente", done: false },
  { id: 16, section: "Trámites", text: "DIAN – Pagos Colombia", tag: "finance", done: false },
];

const BOSANET_NOTES = [
  { id: 100, section: "Estratégico", text: "Seguros para BosaPay", tag: "strategic", done: false },
  { id: 101, section: "Estratégico", text: "Contrato MX – revisar con abogado y visa", tag: "strategic", done: false },
  { id: 102, section: "Estratégico", text: "Landing Bosanet → BosaExpress (sin private label)", tag: "strategic", done: false },
  { id: 103, section: "Estratégico", text: "Acciones de Simón y Mariana", tag: "strategic", done: false },
  { id: 104, section: "Estratégico", text: "BosaPay – excepciones $30 nos están afectando", tag: "urgente", done: false },
  { id: 105, section: "Estratégico", text: "Depositar todo en City National Bank", tag: "finance", done: false },
  { id: 106, section: "Estratégico", text: "Enviar presupuesto a cada área", tag: "general", done: false },
  { id: 107, section: "Marcas & Legal", text: "Registro Bosapay – buscar reunión", tag: "general", done: false },
  { id: 108, section: "Marcas & Legal", text: "Registro marca BI – rechazada, buscar reunión", tag: "urgente", done: false },
  { id: 109, section: "Marcas & Legal", text: "Registro EU Trademarkia $3.000", tag: "finance", done: false },
  { id: 110, section: "Marcas & Legal", text: "Abogado Plataforma B2B en USA", tag: "general", done: false },
  { id: 111, section: "Marcas & Legal", text: "Taxes Colombia", tag: "urgente", done: false },
  { id: 112, section: "Marcas & Legal", text: "Cobrar UNFI", tag: "finance", done: false },
  { id: 113, section: "Inversiones", text: "LUCIO: $15K", tag: "inversion", done: false },
  { id: 114, section: "Inversiones", text: "JUAN GOMEZ – cambiar SAFE al 2024", tag: "inversion", done: false },
  { id: 115, section: "Inversiones", text: "Preparar Due Diligence", tag: "inversion", done: false },
  { id: 116, section: "Inversiones", text: "Terminar Business Plan y presentación gerencial", tag: "inversion", done: false },
  { id: 117, section: "Inversiones", text: "SVB – responder", tag: "urgente", done: false },
  { id: 118, section: "Aliados", text: "Bancoldex", tag: "general", done: false },
  { id: 119, section: "Aliados", text: "Almuerzo: Landaeta Sysco", tag: "general", done: false },
  { id: 120, section: "Aliados", text: "Almuerzo: Sandra OEA", tag: "general", done: false },
  { id: 121, section: "Aliados", text: "Café: Danny", tag: "general", done: false },
];

const TAG_COLORS = {
  urgente:  { bg: "rgba(224,107,107,.15)", color: "#e06b6b", label: "⚡ Urgente" },
  strategic:{ bg: "rgba(74,158,255,.12)",  color: "#4a9eff", label: "🎯 Estratégico" },
  finance:  { bg: "rgba(92,186,138,.12)",  color: "#5cba8a", label: "💰 Finanzas" },
  inversion:{ bg: "rgba(224,140,74,.12)",  color: "#e08c4a", label: "📈 Inversión" },
  general:  { bg: "transparent", color: "#6b6e7a", label: "" },
};

function buildCalendar(eventDays) {
  const days = [];
  const firstDay = new Date(2026, 2, 1).getDay();
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= 31; d++) days.push(d);
  return days;
}

export default function Dashboard() {
  const [panel, setPanel] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [emails, setEmails] = useState({ personal: [], bosanet: [] });
  const [events, setEvents] = useState([]);
  const [pNotes, setPNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_pnotes") || "null") || PERSONAL_NOTES; } catch { return PERSONAL_NOTES; }
  });
  const [bNotes, setBNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_bnotes") || "null") || BOSANET_NOTES; } catch { return BOSANET_NOTES; }
  });
  const [pInput, setPInput] = useState("");
  const [bInput, setBInput] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const isP = panel === "personal";
  const accent = isP ? "#d4a843" : "#4a9eff";
  const glow = isP ? "rgba(212,168,67,0.12)" : "rgba(74,158,255,0.12)";
  const badge = isP ? "rgba(212,168,67,0.15)" : "rgba(74,158,255,0.15)";

  const pPending = pNotes.filter(n => !n.done).length;
  const bPending = bNotes.filter(n => !n.done).length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setAiSummary("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a personal assistant for Francisco Borrero. 
He has two email accounts:
- Personal: fcob2014@gmail.com
- Bosanet (work): fborrero@bosanet.com (forwarded emails from Outlook arrive in Gmail from this address)

Fetch his recent Gmail inbox and upcoming Google Calendar events for this week (March 1-8, 2026).
Return ONLY a JSON object with this exact structure, no markdown, no explanation:
{
  "personalEmails": [{"from": "...", "subject": "...", "time": "...", "unread": true/false}],
  "bosanetEmails": [{"from": "...", "subject": "...", "time": "...", "unread": true/false}],
  "events": [{"day": 3, "dayName": "Mar", "title": "...", "time": "...", "type": "personal/bosanet"}],
  "summary": "2-3 sentence briefing of what's most important today for Francisco"
}
Limit to 5 emails per account and 5 events max.`,
          messages: [{ role: "user", content: "Fetch Francisco's emails and calendar for today's dashboard update." }],
          mcp_servers: [
            { type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" },
            { type: "url", url: "https://gcal.mcp.claude.com/mcp", name: "google-calendar" }
          ]
        })
      });

      const data = await res.json();
      const textBlock = data.content?.find(b => b.type === "text");
      if (textBlock?.text) {
        try {
          const clean = textBlock.text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);
          setEmails({ personal: parsed.personalEmails || [], bosanet: parsed.bosanetEmails || [] });
          setEvents(parsed.events || []);
          if (parsed.summary) setAiSummary(parsed.summary);
        } catch {
          // fallback to static data if parse fails
          setFallbackData();
        }
      } else {
        setFallbackData();
      }
    } catch {
      setFallbackData();
    }
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  function setFallbackData() {
    setEmails({
      personal: [
        { from: "Google", subject: "Security alert – Claude Calendar access", time: "1:10 PM", unread: true },
        { from: "The New York Times", subject: "The Morning: Killing Iran's leader", time: "1:01 PM", unread: true },
        { from: "Uber Receipts", subject: "Your Saturday evening trip – $67.43", time: "12:19 PM", unread: true },
        { from: "Google", subject: "Security alert – Claude Gmail access", time: "12:36 PM", unread: true },
        { from: "Vineyard Vines", subject: "You Will *Love* These Bestselling Favorites", time: "7:17 AM", unread: false },
      ],
      bosanet: [
        { from: "Dusty Gilvin · Cantor", subject: "Quick Intro at Expo West", time: "1:21 PM", unread: true },
        { from: "Cantor (reenvío)", subject: "FW- Quick Intro at Expo West", time: "1:31 PM", unread: true },
        { from: "QuickBooks / Intuit", subject: "Line of Credit payment coming due", time: "1:21 PM", unread: false },
        { from: "Francisco Borrero", subject: "Juliana", time: "Feb 27", unread: false },
      ]
    });
    setEvents([
      { day: 3, dayName: "Mar", title: "✈️ Flight to LAX (B6 2801)", time: "9:10 AM → 3:09 PM", type: "personal" },
      { day: 6, dayName: "Mar", title: "✈️ Flight to FLL (B6 700)", time: "6:00 PM → 10:48 PM", type: "personal" },
    ]);
  }

  useEffect(() => { fetchData(); }, []);

  const saveNotes = (scope, notes) => {
    localStorage.setItem(scope === "p" ? "fx_pnotes" : "fx_bnotes", JSON.stringify(notes));
  };

  const toggleNote = (scope, id) => {
    if (scope === "p") {
      const updated = pNotes.map(n => n.id === id ? { ...n, done: !n.done } : n);
      setPNotes(updated); saveNotes("p", updated);
    } else {
      const updated = bNotes.map(n => n.id === id ? { ...n, done: !n.done } : n);
      setBNotes(updated); saveNotes("b", updated);
    }
  };

  const addNote = (scope) => {
    const text = scope === "p" ? pInput.trim() : bInput.trim();
    if (!text) return;
    const newNote = { id: Date.now(), section: "Nuevas", text, tag: "general", done: false };
    if (scope === "p") { const u = [newNote, ...pNotes]; setPNotes(u); saveNotes("p", u); setPInput(""); }
    else { const u = [newNote, ...bNotes]; setBNotes(u); saveNotes("b", u); setBInput(""); }
  };

  const calDays = buildCalendar([3, 6]);
  const eventDays = events.map(e => e.day);
  const notes = isP ? pNotes : bNotes;
  const sections = {};
  notes.forEach(n => { if (!sections[n.section]) sections[n.section] = []; sections[n.section].push(n); });
  const curEmails = isP ? emails.personal : emails.bosanet;

  const WD = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const MN = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const now = new Date(2026, 2, 1);
  const dateStr = `${WD[now.getDay()]}, ${now.getDate()} ${MN[now.getMonth()]} 2026`;

  const s = {
    root: { background: "#111214", minHeight: "100vh", color: "#e8e9ec", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 },
    header: { padding: "18px 32px", borderBottom: "1px solid #2b2c32", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontFamily: "'Playfair Display', serif", fontSize: 19, display: "flex", alignItems: "center", gap: 8 },
    tabs: { display: "flex", background: "#18191d", border: "1px solid #2b2c32", borderRadius: 10, padding: 3, gap: 0 },
    tab: (active) => ({ padding: "6px 18px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit",
      background: active ? badge : "transparent", color: active ? accent : "#6b6e7a",
      boxShadow: active ? `0 0 0 1px ${accent}44` : "none", transition: "all .2s" }),
    datePill: { fontSize: 11, color: "#6b6e7a", background: "#18191d", border: "1px solid #2b2c32", padding: "5px 12px", borderRadius: 20, letterSpacing: ".06em", textTransform: "uppercase" },
    statsBar: { display: "flex", alignItems: "center", borderBottom: "1px solid #2b2c32", overflowX: "auto", padding: "0 32px" },
    stat: { padding: "12px 24px", borderRight: "1px solid #2b2c32", flexShrink: 0 },
    statVal: { fontFamily: "'Playfair Display', serif", fontSize: 24, lineHeight: 1, color: accent },
    statLabel: { fontSize: 10, color: "#6b6e7a", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 3 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, padding: "20px 32px 36px" },
    card: { background: "#18191d", border: "1px solid #2b2c32", borderRadius: 14, overflow: "hidden" },
    cardHeader: { padding: "13px 18px 10px", borderBottom: "1px solid #2b2c32", display: "flex", alignItems: "center", gap: 9 },
    cardIcon: { fontSize: 14, width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: glow },
    cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 600 },
    cardBadge: { marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: badge, color: accent },
    emailItem: { padding: "9px 18px", borderBottom: "1px solid rgba(255,255,255,.04)", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 9, transition: "background .15s" },
    emailDot: (u) => ({ width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: u ? accent : "transparent", border: u ? "none" : "1px solid #3a3b42" }),
    emailFrom: { fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    emailSubject: { fontSize: 11, color: "#6b6e7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 },
    emailTime: { fontSize: 10, color: "#6b6e7a", flexShrink: 0, paddingLeft: 8 },
    calMini: { padding: "12px 18px", borderBottom: "1px solid #2b2c32" },
    calGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center" },
    calLabel: { fontSize: 9, color: "#6b6e7a", textTransform: "uppercase", letterSpacing: ".06em", padding: "3px 0 4px" },
    calDay: (isToday, hasEv, isEmpty) => ({ fontSize: 11, padding: "4px 0", borderRadius: 5, cursor: isEmpty ? "default" : "pointer",
      background: isToday ? accent : "transparent", color: isToday ? "#111" : hasEv ? "#5cba8a" : "#6b6e7a",
      fontWeight: isToday || hasEv ? 700 : 400 }),
    eventItem: { padding: "9px 18px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", gap: 11, alignItems: "center", cursor: "pointer" },
    eDayNum: { fontFamily: "'Playfair Display', serif", fontSize: 20, lineHeight: 1, color: accent, textAlign: "center", minWidth: 28 },
    eDayName: { fontSize: 9, color: "#6b6e7a", textTransform: "uppercase", textAlign: "center" },
    eTitle: { fontSize: 12, fontWeight: 500 },
    eTime: { fontSize: 10, color: "#6b6e7a", marginTop: 2 },
    ePill: { fontSize: 10, padding: "2px 8px", borderRadius: 10, background: glow, color: accent, marginLeft: "auto" },
    notesScroll: { maxHeight: 460, overflowY: "auto", padding: "12px 18px 14px" },
    sectionTitle: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 7, paddingBottom: 5, borderBottom: "1px solid #2b2c32" },
    noteItem: { display: "flex", alignItems: "flex-start", gap: 9, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.04)", cursor: "pointer" },
    noteCheck: (done) => ({ width: 14, height: 14, borderRadius: 4, border: done ? "none" : "1px solid #3a3b42", flexShrink: 0, marginTop: 2,
      background: done ? "rgba(92,186,138,.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }),
    noteText: (done) => ({ fontSize: 12, color: done ? "#3a3b42" : "#6b6e7a", lineHeight: 1.5, textDecoration: done ? "line-through" : "none", flex: 1 }),
    addArea: { padding: "10px 18px 14px", borderTop: "1px solid #2b2c32" },
    addRow: { display: "flex", gap: 7 },
    addInput: { flex: 1, background: "#1f2025", border: "1px solid #2b2c32", borderRadius: 8, color: "#e8e9ec", fontFamily: "inherit", fontSize: 12, padding: "7px 11px", outline: "none" },
    addBtn: { border: "none", borderRadius: 8, padding: "7px 13px", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", background: accent, color: "#111" },
    refreshBtn: { display: "flex", alignItems: "center", gap: 6, border: "1px solid #2b2c32", borderRadius: 8, padding: "6px 14px", background: "#18191d", color: "#6b6e7a", cursor: "pointer", fontFamily: "inherit", fontSize: 11, transition: "all .2s" },
    summaryBar: { margin: "0 32px 0", background: "#1a1c1f", border: `1px solid ${accent}33`, borderRadius: 12, padding: "12px 18px", marginBottom: -10 },
  };

  return (
    <div style={s.root}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logo}>
          Francisco <span style={{ color: "#3a3b42" }}>·</span>
          <span style={{ color: accent, transition: "color .3s" }}>{isP ? "Personal" : "Bosanet"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={s.refreshBtn} onClick={fetchData} disabled={loading}>
            <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>🔄</span>
            {loading ? "Actualizando..." : lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}` : "Actualizar"}
          </button>
          <div style={s.tabs}>
            <button style={s.tab(isP)} onClick={() => setPanel("personal")}>🙋 Personal</button>
            <button style={s.tab(!isP)} onClick={() => setPanel("bosanet")}>🏢 Bosanet</button>
          </div>
          <div style={s.datePill}>{dateStr}</div>
        </div>
      </div>

      {/* STATS */}
      <div style={s.statsBar}>
        <div style={s.stat}>
          <div style={s.statVal}>{curEmails.filter(e => e.unread).length}</div>
          <div style={s.statLabel}>No leídos</div>
        </div>
        <div style={{ ...s.stat, borderRight: "1px solid #2b2c32" }}>
          <div style={s.statVal}>{events.filter(e => isP || e.type === "bosanet").length || events.length}</div>
          <div style={s.statLabel}>Eventos semana</div>
        </div>
        <div style={s.stat}>
          <div style={s.statVal}>{isP ? pPending : bPending}</div>
          <div style={s.statLabel}>Tareas pendientes</div>
        </div>
        <div style={s.stat}>
          <div style={s.statVal}>{isP ? "✈️" : "🌴"}</div>
          <div style={s.statLabel}>{isP ? "Vuelo Mar 3 · LAX" : "Expo West · Mar 3"}</div>
        </div>
        <div style={{ ...s.stat, marginLeft: "auto", borderRight: "none" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontStyle: "italic" }}>
            Buenas tardes, <span style={{ color: accent }}>Francisco</span>
          </div>
        </div>
      </div>

      {/* AI SUMMARY */}
      {aiSummary && (
        <div style={{ padding: "16px 32px 0" }}>
          <div style={s.summaryBar}>
            <span style={{ fontSize: 10, color: accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>🤖 Resumen del día · </span>
            <span style={{ fontSize: 12, color: "#9a9aa8" }}>{aiSummary}</span>
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div style={s.grid}>

        {/* EMAIL */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardIcon}>📧</div>
            <span style={s.cardTitle}>{isP ? "Gmail Personal" : "Outlook Bosanet"}</span>
            <div style={s.cardBadge}>{isP ? "fcob2014@gmail.com" : "fborrero@bosanet.com"}</div>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b6e7a", fontSize: 12 }}>Cargando correos...</div>
          ) : curEmails.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b6e7a", fontSize: 12, fontStyle: "italic" }}>Sin correos recientes</div>
          ) : curEmails.map((e, i) => (
            <div key={i} style={s.emailItem}>
              <div style={s.emailDot(e.unread)}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.emailFrom}>{e.from}</div>
                <div style={s.emailSubject}>{e.subject}</div>
              </div>
              <div style={s.emailTime}>{e.time}</div>
            </div>
          ))}
        </div>

        {/* CALENDAR */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardIcon}>📅</div>
            <span style={s.cardTitle}>Calendario</span>
            <div style={s.cardBadge}>Marzo 2026</div>
          </div>
          <div style={s.calMini}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, marginBottom: 7 }}>Marzo 2026</div>
            <div style={s.calGrid}>
              {["D","L","M","M","J","V","S"].map((d, i) => <div key={i} style={s.calLabel}>{d}</div>)}
              {calDays.map((d, i) => (
                <div key={i} style={s.calDay(d === 1, eventDays.includes(d), d === null)}>
                  {d || ""}
                </div>
              ))}
            </div>
          </div>
          {events.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#6b6e7a", fontSize: 11, fontStyle: "italic" }}>Sin eventos esta semana</div>
          ) : events.map((ev, i) => (
            <div key={i} style={s.eventItem}>
              <div>
                <div style={s.eDayNum}>{ev.day}</div>
                <div style={s.eDayName}>{ev.dayName}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.eTitle}>{ev.title}</div>
                <div style={s.eTime}>{ev.time}</div>
              </div>
              <div style={s.ePill}>Viaje</div>
            </div>
          ))}
        </div>

        {/* NOTES */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardIcon}>📝</div>
            <span style={s.cardTitle}>{isP ? "Notas Personales" : "Notas Bosanet"}</span>
            <div style={s.cardBadge}>{isP ? pPending : bPending} pendientes</div>
          </div>
          <div style={s.notesScroll}>
            {Object.entries(sections).map(([sec, items]) => (
              <div key={sec} style={{ marginBottom: 14 }}>
                <div style={s.sectionTitle}>{sec}</div>
                {items.map(n => {
                  const tc = TAG_COLORS[n.tag];
                  return (
                    <div key={n.id} style={s.noteItem} onClick={() => toggleNote(isP ? "p" : "b", n.id)}>
                      <div style={s.noteCheck(n.done)}>{n.done && <span style={{ fontSize: 9, color: "#5cba8a" }}>✓</span>}</div>
                      <div style={s.noteText(n.done)}>{n.text}</div>
                      {tc.label && (
                        <div style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: tc.bg, color: tc.color, flexShrink: 0, alignSelf: "flex-start", marginTop: 3 }}>
                          {tc.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={s.addArea}>
            <div style={s.addRow}>
              <input
                style={s.addInput}
                placeholder="Agregar tarea..."
                value={isP ? pInput : bInput}
                onChange={e => isP ? setPInput(e.target.value) : setBInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote(isP ? "p" : "b")}
              />
              <button style={s.addBtn} onClick={() => addNote(isP ? "p" : "b")}>+ Agregar</button>
            </div>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
