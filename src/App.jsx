import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://grtmfhlcsfmvzmtrxugg.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydG1maGxjc2ZtdnptdHJ4dWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTg2MzgsImV4cCI6MjA5MDAzNDYzOH0.BInOLC0LRPGNRF4QqrExDwRbbJQZOHNtg3pFnq-hXdU";

async function sbFetch(path, opts = {}) {
  const session = JSON.parse(localStorage.getItem("sb_session") || "null");
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON,
    "Authorization": `Bearer ${session?.access_token || SUPABASE_ANON}`,
    ...opts.headers,
  };
  const res = await fetch(`${SUPABASE_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

async function authSignIn(email, password) {
  const data = await sbFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("sb_session", JSON.stringify(data));
  return data;
}

async function authSignUp(email, password) {
  return await sbFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function authSignOut() {
  await sbFetch("/auth/v1/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("sb_session");
}

function getSession() {
  return JSON.parse(localStorage.getItem("sb_session") || "null");
}

const db = {
  select: (table, params = "") => sbFetch(`/rest/v1/${table}${params}`, { headers: { Prefer: "return=representation" } }),
  insert: (table, body) => sbFetch(`/rest/v1/${table}`, { method: "POST", body: JSON.stringify(body), headers: { Prefer: "return=representation" } }),
  update: (table, filter, body) => sbFetch(`/rest/v1/${table}?${filter}`, { method: "PATCH", body: JSON.stringify(body), headers: { Prefer: "return=representation" } }),
  delete: (table, filter) => sbFetch(`/rest/v1/${table}?${filter}`, { method: "DELETE" }),
};

const today = () => new Date().toISOString().split("T")[0];
const fmt = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
const fmtFull = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

const PRIORIDAD_COLORS = { baja: "#86efac", media: "#fde68a", alta: "#fb923c", urgente: "#f87171" };
const ESTADO_COLORS = { pendiente: "#a78bfa", en_progreso: "#60a5fa", completada: "#34d399", cancelada: "#9ca3af" };
const ESTADO_LABELS = { pendiente: "Pendiente", en_progreso: "En progreso", completada: "Completada", cancelada: "Cancelada" };
const PRIORIDAD_LABELS = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" };
const CATS_DEFAULT = [
  { nombre: "Estudio", color: "#818cf8", icono: "📚" },
  { nombre: "Trabajo", color: "#fb923c", icono: "💼" },
  { nombre: "Personal", color: "#f472b6", icono: "🌸" },
  { nombre: "Trámites", color: "#fbbf24", icono: "📋" },
  { nombre: "Proyecto", color: "#34d399", icono: "🚀" },
  { nombre: "Recordatorio", color: "#60a5fa", icono: "🔔" },
];

const Card = ({ children, className = "", style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "1rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) => {
  const base = { border: "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, transition: "opacity .15s", opacity: disabled ? .6 : 1, ...style };
  const sizes = { sm: { padding: "4px 12px", fontSize: 13 }, md: { padding: "8px 18px", fontSize: 14 }, lg: { padding: "11px 24px", fontSize: 15 } };
  const variants = {
    primary: { background: "#a78bfa", color: "#fff" },
    secondary: { background: "#f3f0ff", color: "#7c3aed" },
    danger: { background: "#fee2e2", color: "#dc2626" },
    ghost: { background: "transparent", color: "#6b7280" },
    success: { background: "#d1fae5", color: "#065f46" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>{label}</label>}
    <input {...props} style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa", ...props.style }} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>{label}</label>}
    <select {...props} style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box" }}>
      {children}
    </select>
  </div>
);

const ProgressBar = ({ value, color = "#a78bfa", label }) => (
  <div>
    {label && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 4 }}><span>{label}</span><span style={{ fontWeight: 700, color }}>{Math.round(value)}%</span></div>}
    <div style={{ background: "#f3f0ff", borderRadius: 99, height: 10, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, background: color, height: "100%", borderRadius: 99, transition: "width .4s" }} />
    </div>
  </div>
);

const Badge = ({ text, color = "#a78bfa", bg }) => (
  <span style={{ background: bg || color + "22", color, borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{text}</span>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 40px rgba(0,0,0,.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f0ff" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#4b2d8a" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "16px 20px" }}>{children}</div>
      </div>
    </div>
  );
};

function useAgenda(userId) {
  const [tareas, setTareas] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        db.select("agenda_tareas", `?user_id=eq.${userId}&order=fecha.asc,hora.asc`),
        db.select("agenda_categorias", `?user_id=eq.${userId}&order=nombre.asc`),
      ]);
      const ids = (t || []).map(x => x.id);
      let subs = [];
      if (ids.length) {
        subs = await db.select("agenda_subtareas", `?tarea_id=in.(${ids.join(",")})&order=orden.asc`);
      }
      const tareasConSubs = (t || []).map(tar => ({
        ...tar,
        subtareas: (subs || []).filter(s => s.tarea_id === tar.id),
      }));
      setTareas(tareasConSubs);
      setCats(c || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const progreso = (t) => {
    if (!t.subtareas?.length) return t.estado === "completada" ? 100 : 0;
    const done = t.subtareas.filter(s => s.completada).length;
    return Math.round((done / t.subtareas.length) * 100);
  };

  return { tareas, cats, loading, reload: loadAll, progreso };
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");

  const handle = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const s = await authSignIn(email, pass);
        onLogin(s.user);
      } else {
        await authSignUp(email, pass);
        setErr("✅ Cuenta creada. Revisá tu correo para confirmar, luego ingresá.");
        setMode("login");
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f0ff 0%,#fdf2f8 50%,#f0f9ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>📅</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#4b2d8a", margin: "8px 0 4px" }}>Mi Agenda Personal</h1>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Tu organizador diario</p>
        </div>
        <Card>
          <Input label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          <Input label="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
          {err && <p style={{ color: err.startsWith("✅") ? "#16a34a" : "#dc2626", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <Btn onClick={handle} disabled={loading} style={{ width: "100%" }} size="lg">
            {loading ? "Cargando…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </Btn>
          <p style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#6b7280" }}>
            {mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }} style={{ color: "#7c3aed", cursor: "pointer", fontWeight: 600 }}>
              {mode === "login" ? "Registrate" : "Ingresá"}
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
}

function TareaForm({ tarea, cats, userId, onSave, onClose }) {
  const empty = { titulo: "", descripcion: "", fecha: today(), hora: "", categoria_id: "", prioridad: "media", estado: "pendiente", observaciones: "", es_repetitiva: false, tipo_repeticion: "diaria", dias_repeticion: [] };
  const [form, setForm] = useState(tarea ? { ...empty, ...tarea, hora: tarea.hora || "", categoria_id: tarea.categoria_id || "" } : empty);
  const [subs, setSubs] = useState(tarea?.subtareas || []);
  const [newSub, setNewSub] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSub = () => {
    if (!newSub.trim()) return;
    setSubs(s => [...s, { id: "new_" + Date.now(), descripcion: newSub.trim(), completada: false, orden: s.length }]);
    setNewSub("");
  };

  const save = async () => {
    if (!form.titulo.trim()) return alert("El título es obligatorio");
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion || null,
        fecha: form.fecha,
        hora: form.hora || null,
        categoria_id: form.categoria_id || null,
        prioridad: form.prioridad,
        estado: form.estado,
        observaciones: form.observaciones || null,
        es_repetitiva: form.es_repetitiva,
        tipo_repeticion: form.es_repetitiva ? form.tipo_repeticion : null,
        dias_repeticion: form.es_repetitiva && form.tipo_repeticion === "dias_especificos" ? form.dias_repeticion : null,
      };
      let tid;
      if (tarea?.id) {
        await db.update("agenda_tareas", `id=eq.${tarea.id}`, payload);
        tid = tarea.id;
        await db.delete("agenda_subtareas", `tarea_id=eq.${tid}`);
      } else {
        const res = await db.insert("agenda_tareas", payload);
        tid = res[0].id;
      }
      if (subs.length) {
        await db.insert("agenda_subtareas", subs.map((s, i) => ({ tarea_id: tid, descripcion: s.descripcion, completada: s.completada, orden: i })));
      }
      onSave();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  const toggleDia = (d) => set("dias_repeticion", form.dias_repeticion.includes(d) ? form.dias_repeticion.filter(x => x !== d) : [...form.dias_repeticion, d]);

  return (
    <div>
      <Input label="Título *" value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="¿Qué tenés que hacer?" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Fecha *" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
        <Input label="Hora (opcional)" type="time" value={form.hora} onChange={e => set("hora", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Prioridad" value={form.prioridad} onChange={e => set("prioridad", e.target.value)}>
          <option value="baja">🟢 Baja</option>
          <option value="media">🟡 Media</option>
          <option value="alta">🟠 Alta</option>
          <option value="urgente">🔴 Urgente</option>
        </Select>
        <Select label="Estado" value={form.estado} onChange={e => set("estado", e.target.value)}>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </Select>
      </div>
      <Select label="Categoría" value={form.categoria_id} onChange={e => set("categoria_id", e.target.value)}>
        <option value="">Sin categoría</option>
        {cats.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
      </Select>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Descripción (opcional)</label>
        <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)} rows={2} style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box", marginTop: 4, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, display: "block", marginBottom: 6 }}>Checklist</label>
        {subs.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input type="checkbox" checked={s.completada} onChange={() => setSubs(ss => ss.map((x, xi) => xi === i ? { ...x, completada: !x.completada } : x))} />
            <input value={s.descripcion} onChange={e => setSubs(ss => ss.map((x, xi) => xi === i ? { ...x, descripcion: e.target.value } : x))} style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "4px 10px", fontSize: 13, outline: "none", textDecoration: s.completada ? "line-through" : "none", color: s.completada ? "#9ca3af" : "inherit" }} />
            <button onClick={() => setSubs(ss => ss.filter((_, xi) => xi !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16 }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === "Enter" && addSub()} placeholder="Agregar paso…" style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
          <Btn onClick={addSub} variant="secondary" size="sm">+</Btn>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", fontWeight: 500, cursor: "pointer" }}>
          <input type="checkbox" checked={form.es_repetitiva} onChange={e => set("es_repetitiva", e.target.checked)} />
          Tarea repetitiva
        </label>
        {form.es_repetitiva && (
          <div style={{ marginTop: 8, paddingLeft: 24 }}>
            <Select value={form.tipo_repeticion} onChange={e => set("tipo_repeticion", e.target.value)}>
              <option value="diaria">Todos los días</option>
              <option value="semanal">Todas las semanas</option>
              <option value="mensual">Todos los meses</option>
              <option value="dias_especificos">Días específicos</option>
            </Select>
            {form.tipo_repeticion === "dias_especificos" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {dias.map(d => (
                  <button key={d} onClick={() => toggleDia(d)} style={{ padding: "3px 10px", borderRadius: 99, border: "1.5px solid", fontSize: 12, cursor: "pointer", background: form.dias_repeticion.includes(d) ? "#a78bfa" : "#f9fafb", color: form.dias_repeticion.includes(d) ? "#fff" : "#6b7280", borderColor: form.dias_repeticion.includes(d) ? "#a78bfa" : "#e5e7eb" }}>{d}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={save} disabled={saving} style={{ flex: 1 }}>{saving ? "Guardando…" : "Guardar tarea"}</Btn>
        <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
      </div>
    </div>
  );
}

function TareaDetalle({ tarea, cats, userId, onClose, onReload }) {
  const [t, setT] = useState(tarea);
  const [editando, setEditando] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const cat = cats.find(c => c.id === t.categoria_id);
  const totalSubs = t.subtareas?.length || 0;
  const doneSubs = t.subtareas?.filter(s => s.completada).length || 0;
  const pct = totalSubs ? Math.round((doneSubs / totalSubs) * 100) : (t.estado === "completada" ? 100 : 0);

  const toggleSub = async (sub) => {
    const updated = !sub.completada;
    await db.update("agenda_subtareas", `id=eq.${sub.id}`, { completada: updated });
    const newSubs = t.subtareas.map(s => s.id === sub.id ? { ...s, completada: updated } : s);
    const done = newSubs.filter(s => s.completada).length;
    const total = newSubs.length;
    let estado = t.estado;
    if (total > 0) {
      if (done === 0) estado = "pendiente";
      else if (done === total) estado = "completada";
      else estado = "en_progreso";
    }
    if (estado !== t.estado) await db.update("agenda_tareas", `id=eq.${t.id}`, { estado });
    setT({ ...t, subtareas: newSubs, estado });
    onReload();
  };

  const changeEstado = async (estado) => {
    await db.update("agenda_tareas", `id=eq.${t.id}`, { estado });
    setT({ ...t, estado });
    onReload();
  };

  const del = async () => {
    await db.delete("agenda_tareas", `id=eq.${t.id}`);
    onReload();
    onClose();
  };

  if (editando) return (
    <Modal open title="Editar tarea" onClose={() => setEditando(false)}>
      <TareaForm tarea={t} cats={cats} userId={userId} onSave={() => { setEditando(false); onReload(); onClose(); }} onClose={() => setEditando(false)} />
    </Modal>
  );

  const vencida = t.fecha < today() && t.estado !== "completada" && t.estado !== "cancelada";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#1f1235", fontWeight: 700 }}>{t.titulo}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            <Badge text={PRIORIDAD_LABELS[t.prioridad]} color={PRIORIDAD_COLORS[t.prioridad]} />
            <Badge text={ESTADO_LABELS[t.estado]} color={ESTADO_COLORS[t.estado]} />
            {cat && <Badge text={`${cat.icono} ${cat.nombre}`} color={cat.color} />}
            {vencida && <Badge text="⚠️ Vencida" color="#dc2626" />}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
        📅 {fmtFull(t.fecha)}{t.hora ? ` · ⏰ ${t.hora.slice(0, 5)}` : ""}
      </div>
      {t.descripcion && <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>{t.descripcion}</p>}
      {totalSubs > 0 && (
        <div style={{ marginBottom: 16 }}>
          <ProgressBar value={pct} label={`${doneSubs} de ${totalSubs} pasos completados`} />
        </div>
      )}
      {totalSubs > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>CHECKLIST</p>
          {t.subtareas.map(s => (
            <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid #f9f5ff" }}>
              <input type="checkbox" checked={s.completada} onChange={() => toggleSub(s)} style={{ width: 16, height: 16, accentColor: "#a78bfa" }} />
              <span style={{ fontSize: 14, textDecoration: s.completada ? "line-through" : "none", color: s.completada ? "#9ca3af" : "#374151" }}>{s.descripcion}</span>
            </label>
          ))}
        </div>
      )}
      {t.observaciones && <div style={{ background: "#fdf9ff", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#6b7280", marginBottom: 16 }}>💬 {t.observaciones}</div>}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>CAMBIAR ESTADO</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(ESTADO_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => changeEstado(k)} style={{ padding: "4px 12px", borderRadius: 99, border: "1.5px solid", fontSize: 12, cursor: "pointer", background: t.estado === k ? ESTADO_COLORS[k] : "#f9fafb", color: t.estado === k ? "#fff" : "#6b7280", borderColor: t.estado === k ? ESTADO_COLORS[k] : "#e5e7eb", fontWeight: t.estado === k ? 700 : 400 }}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => setEditando(true)} variant="secondary">✏️ Editar</Btn>
        <Btn onClick={() => setConfirmDel(true)} variant="danger">🗑️ Eliminar</Btn>
        {t.estado !== "completada" && <Btn onClick={() => changeEstado("completada")} variant="success">✅ Completar</Btn>}
      </div>
      {confirmDel && (
        <div style={{ marginTop: 16, background: "#fef2f2", borderRadius: 12, padding: 12 }}>
          <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 10 }}>¿Confirmás que querés eliminar esta tarea?</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={del} variant="danger" size="sm">Sí, eliminar</Btn>
            <Btn onClick={() => setConfirmDel(false)} variant="ghost" size="sm">Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ tareas, cats, userId, progreso, onNewTask, onSelect }) {
  const t = today();
  const hoy = tareas.filter(x => x.fecha === t);
  const pendHoy = hoy.filter(x => x.estado !== "completada" && x.estado !== "cancelada");
  const compHoy = hoy.filter(x => x.estado === "completada");
  const vencidas = tareas.filter(x => x.fecha < t && x.estado !== "completada" && x.estado !== "cancelada");
  const urgentes = tareas.filter(x => x.prioridad === "urgente" && x.estado !== "completada" && x.estado !== "cancelada");

  const semStart = new Date(); semStart.setDate(semStart.getDate() - ((semStart.getDay() + 6) % 7));
  const semEnd = new Date(semStart); semEnd.setDate(semEnd.getDate() + 6);
  const semStr = [semStart, semEnd].map(d => d.toISOString().split("T")[0]);
  const semTareas = tareas.filter(x => x.fecha >= semStr[0] && x.fecha <= semStr[1]);
  const semComp = semTareas.filter(x => x.estado === "completada");

  const pctDia = hoy.length ? Math.round((compHoy.length / hoy.length) * 100) : 0;
  const pctSem = semTareas.length ? Math.round((semComp.length / semTareas.length) * 100) : 0;
  const proximas = tareas.filter(x => x.fecha > t && x.estado !== "completada" && x.estado !== "cancelada").slice(0, 4);

  return (
    <div style={{ padding: "0 0 80px" }}>
      <div style={{ background: "linear-gradient(135deg,#a78bfa,#c084fc)", borderRadius: "0 0 24px 24px", padding: "24px 20px 32px", color: "#fff", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, opacity: .8 }}>{fmtFull(t)}</p>
        <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800 }}>
          {pendHoy.length === 0 && hoy.length > 0 ? "🎉 ¡Completaste todo!" : pendHoy.length === 0 ? "No tenés tareas para hoy" : `Tenés ${pendHoy.length} tarea${pendHoy.length !== 1 ? "s" : ""} pendiente${pendHoy.length !== 1 ? "s" : ""} para hoy`}
        </h2>
        <div style={{ marginTop: 16 }}>
          <ProgressBar value={pctDia} color="rgba(255,255,255,0.9)" label={`Progreso del día: ${compHoy.length}/${hoy.length} completadas`} />
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Pendientes hoy", val: pendHoy.length, color: "#a78bfa", icon: "⏳" },
            { label: "Completadas hoy", val: compHoy.length, color: "#34d399", icon: "✅" },
            { label: "Vencidas", val: vencidas.length, color: "#f87171", icon: "⚠️" },
            { label: "Urgentes", val: urgentes.length, color: "#fb923c", icon: "🔴" },
          ].map(s => (
            <Card key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.label}</div>
            </Card>
          ))}
        </div>
        <Card style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#4b2d8a" }}>📊 Progreso de la semana</p>
          <ProgressBar value={pctSem} label={`${semComp.length} de ${semTareas.length} tareas completadas`} />
        </Card>
        {vencidas.length > 0 && (
          <Card style={{ marginBottom: 16, border: "1.5px solid #fecaca" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#dc2626", fontSize: 14 }}>⚠️ Tareas vencidas</p>
            {vencidas.slice(0, 3).map(t => (
              <div key={t.id} onClick={() => onSelect(t)} style={{ padding: "6px 0", borderBottom: "1px solid #fef2f2", cursor: "pointer" }}>
                <span style={{ fontSize: 14, color: "#374151" }}>{t.titulo}</span>
                <span style={{ fontSize: 12, color: "#f87171", marginLeft: 8 }}>{fmt(t.fecha)}</span>
              </div>
            ))}
          </Card>
        )}
        {urgentes.length > 0 && (
          <Card style={{ marginBottom: 16, border: "1.5px solid #fed7aa" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#ea580c", fontSize: 14 }}>🔴 Urgentes pendientes</p>
            {urgentes.slice(0, 3).map(t => (
              <div key={t.id} onClick={() => onSelect(t)} style={{ padding: "6px 0", borderBottom: "1px solid #fff7ed", cursor: "pointer" }}>
                <span style={{ fontSize: 14, color: "#374151" }}>{t.titulo}</span>
              </div>
            ))}
          </Card>
        )}
        {proximas.length > 0 && (
          <Card style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#4b2d8a" }}>📅 Próximas tareas</p>
            {proximas.map(t => (
              <div key={t.id} onClick={() => onSelect(t)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f9f5ff", cursor: "pointer" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: PRIORIDAD_COLORS[t.prioridad], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#1f1235" }}>{t.titulo}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{fmt(t.fecha)}</div>
                </div>
                <Badge text={PRIORIDAD_LABELS[t.prioridad]} color={PRIORIDAD_COLORS[t.prioridad]} />
              </div>
            ))}
          </Card>
        )}
        <Btn onClick={onNewTask} style={{ width: "100%" }} size="lg">+ Nueva tarea para hoy</Btn>
      </div>
    </div>
  );
}

function MisTareas({ tareas, cats, userId, progreso, onNew, onSelect }) {
  const [busq, setBusq] = useState("");
  const [filtros, setFiltros] = useState({ fecha: "", cat: "", prioridad: "", estado: "", solo_hoy: false });
  const t = today();

  let lista = [...tareas];
  if (filtros.solo_hoy) lista = lista.filter(x => x.fecha === t);
  if (filtros.fecha) lista = lista.filter(x => x.fecha === filtros.fecha);
  if (filtros.cat) lista = lista.filter(x => x.categoria_id === filtros.cat);
  if (filtros.prioridad) lista = lista.filter(x => x.prioridad === filtros.prioridad);
  if (filtros.estado) {
    if (filtros.estado === "vencidas") lista = lista.filter(x => x.fecha < t && x.estado !== "completada" && x.estado !== "cancelada");
    else lista = lista.filter(x => x.estado === filtros.estado);
  }
  if (busq) lista = lista.filter(x => x.titulo.toLowerCase().includes(busq.toLowerCase()));

  const setF = (k, v) => setFiltros(f => ({ ...f, [k]: v }));

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "#4b2d8a", fontWeight: 800 }}>Mis Tareas</h2>
        <Btn onClick={onNew} size="sm">+ Nueva</Btn>
      </div>
      <Input placeholder="🔍 Buscar tareas…" value={busq} onChange={e => setBusq(e.target.value)} style={{ marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <Select value={filtros.cat} onChange={e => setF("cat", e.target.value)}>
          <option value="">Todas las categorías</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
        </Select>
        <Select value={filtros.prioridad} onChange={e => setF("prioridad", e.target.value)}>
          <option value="">Toda prioridad</option>
          <option value="urgente">🔴 Urgente</option>
          <option value="alta">🟠 Alta</option>
          <option value="media">🟡 Media</option>
          <option value="baja">🟢 Baja</option>
        </Select>
        <Select value={filtros.estado} onChange={e => setF("estado", e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
          <option value="vencidas">⚠️ Vencidas</option>
        </Select>
        <Input type="date" value={filtros.fecha} onChange={e => setF("fecha", e.target.value)} />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={filtros.solo_hoy} onChange={e => setF("solo_hoy", e.target.checked)} />
        Mostrar solo tareas de hoy
      </label>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>{lista.length} tarea{lista.length !== 1 ? "s" : ""}</p>
      {lista.length === 0 && <Card style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No hay tareas que coincidan</Card>}
      {lista.map(tar => {
        const cat = cats.find(c => c.id === tar.categoria_id);
        const p = progreso(tar);
        const vencida = tar.fecha < t && tar.estado !== "completada" && tar.estado !== "cancelada";
        return (
          <Card key={tar.id} onClick={() => onSelect(tar)} style={{ marginBottom: 10, cursor: "pointer", borderLeft: `4px solid ${PRIORIDAD_COLORS[tar.prioridad]}`, background: vencida ? "#fef2f2" : tar.estado === "completada" ? "#f0fdf4" : "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: tar.estado === "completada" ? "#9ca3af" : "#1f1235", textDecoration: tar.estado === "completada" ? "line-through" : "none" }}>{tar.titulo}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{fmt(tar.fecha)}{tar.hora ? ` · ${tar.hora.slice(0, 5)}` : ""}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <Badge text={ESTADO_LABELS[tar.estado]} color={ESTADO_COLORS[tar.estado]} />
                {cat && <Badge text={`${cat.icono} ${cat.nombre}`} color={cat.color} />}
              </div>
            </div>
            {tar.subtareas?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <ProgressBar value={p} />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{tar.subtareas.filter(s => s.completada).length}/{tar.subtareas.length} pasos</div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Agenda({ tareas, cats, onSelect, onNew }) {
  const [fecha, setFecha] = useState(today());
  const [vista, setVista] = useState("dia");

  const semDias = () => {
    const d = new Date(fecha + "T12:00:00");
    const lunes = new Date(d); lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const dd = new Date(lunes); dd.setDate(lunes.getDate() + i); return dd.toISOString().split("T")[0]; });
  };

  const mesDias = () => {
    const d = new Date(fecha + "T12:00:00");
    const ini = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const days = [];
    const dow = (ini.getDay() + 6) % 7;
    for (let i = 0; i < dow; i++) days.push(null);
    for (let dd = new Date(ini); dd <= fin; dd.setDate(dd.getDate() + 1)) days.push(new Date(dd).toISOString().split("T")[0]);
    return days;
  };

  const tareasDia = tareas.filter(x => x.fecha === fecha).sort((a, b) => (a.hora || "99") > (b.hora || "99") ? 1 : -1);

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "#4b2d8a", fontWeight: 800 }}>Agenda</h2>
        <Btn onClick={() => onNew(fecha)} size="sm">+ Tarea</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["dia", "semana", "mes"].map(v => (
          <button key={v} onClick={() => setVista(v)} style={{ padding: "6px 16px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: vista === v ? "#a78bfa" : "#f3f0ff", color: vista === v ? "#fff" : "#7c3aed" }}>
            {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
          </button>
        ))}
      </div>
      <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ marginBottom: 16 }} />
      {vista === "dia" && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#4b2d8a", marginBottom: 12 }}>{fmtFull(fecha)}</p>
          {tareasDia.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p>No hay tareas este día</p>
              <Btn onClick={() => onNew(fecha)} variant="secondary" size="sm">Agregar tarea</Btn>
            </Card>
          ) : tareasDia.map(t => {
            const cat = cats.find(c => c.id === t.categoria_id);
            return (
              <Card key={t.id} onClick={() => onSelect(t)} style={{ marginBottom: 10, cursor: "pointer", borderLeft: `4px solid ${PRIORIDAD_COLORS[t.prioridad]}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.titulo}</div>
                    {t.hora && <div style={{ fontSize: 12, color: "#9ca3af" }}>⏰ {t.hora.slice(0, 5)}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    <Badge text={ESTADO_LABELS[t.estado]} color={ESTADO_COLORS[t.estado]} />
                    {cat && <Badge text={`${cat.icono} ${cat.nombre}`} color={cat.color} />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {vista === "semana" && (
        <div>
          {semDias().map(d => {
            const dt = tareas.filter(x => x.fecha === d);
            const dn = new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
            return (
              <div key={d} onClick={() => { setFecha(d); setVista("dia"); }} style={{ marginBottom: 8, cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: d === today() ? "#7c3aed" : "#9ca3af", marginBottom: 4 }}>{dn.toUpperCase()}</div>
                <Card style={{ padding: "8px 12px", background: d === today() ? "#f5f0ff" : "#fff", border: d === today() ? "1.5px solid #a78bfa" : "none" }}>
                  {dt.length === 0 ? <span style={{ fontSize: 13, color: "#d1d5db" }}>Sin tareas</span> : dt.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORIDAD_COLORS[t.prioridad], flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{t.titulo}</span>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}
      {vista === "mes" && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#4b2d8a", marginBottom: 12 }}>
            {new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" }).toUpperCase()}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {["Lu","Ma","Mi","Ju","Vi","Sa","Do"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {mesDias().map((d, i) => {
              if (!d) return <div key={i} />;
              const dt = tareas.filter(x => x.fecha === d);
              const isHoy = d === today();
              const isSel = d === fecha;
              return (
                <div key={d} onClick={() => { setFecha(d); setVista("dia"); }} style={{ borderRadius: 10, padding: "6px 4px", textAlign: "center", cursor: "pointer", background: isSel ? "#a78bfa" : isHoy ? "#f5f0ff" : "#fff", border: isHoy ? "1.5px solid #a78bfa" : "1px solid #f3f0ff", minHeight: 50 }}>
                  <div style={{ fontSize: 13, fontWeight: isHoy || isSel ? 700 : 400, color: isSel ? "#fff" : isHoy ? "#7c3aed" : "#374151" }}>{parseInt(d.split("-")[2])}</div>
                  {dt.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", marginTop: 2 }}>
                    {dt.slice(0, 3).map((t, ti) => <span key={ti} style={{ width: 6, height: 6, borderRadius: "50%", background: isSel ? "rgba(255,255,255,.7)" : PRIORIDAD_COLORS[t.prioridad] }} />)}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MiProgreso({ tareas, cats }) {
  const t = today();
  const semStart = new Date(); semStart.setDate(semStart.getDate() - ((semStart.getDay() + 6) % 7));
  const mesStart = t.slice(0, 7) + "-01";
  const semStr = semStart.toISOString().split("T")[0];

  const hoyComp = tareas.filter(x => x.fecha === t && x.estado === "completada");
  const semComp = tareas.filter(x => x.fecha >= semStr && x.fecha <= t && x.estado === "completada");
  const mesComp = tareas.filter(x => x.fecha >= mesStart && x.fecha <= t && x.estado === "completada");
  const hoyTot = tareas.filter(x => x.fecha === t);
  const semTot = tareas.filter(x => x.fecha >= semStr && x.fecha <= t);
  const mesTot = tareas.filter(x => x.fecha >= mesStart && x.fecha <= t);
  const vencidas = tareas.filter(x => x.fecha < t && x.estado !== "completada" && x.estado !== "cancelada");

  const pctH = hoyTot.length ? Math.round((hoyComp.length / hoyTot.length) * 100) : 0;
  const pctS = semTot.length ? Math.round((semComp.length / semTot.length) * 100) : 0;
  const pctM = mesTot.length ? Math.round((mesComp.length / mesTot.length) * 100) : 0;

  const catStats = cats.map(c => ({
    ...c,
    total: tareas.filter(x => x.categoria_id === c.id).length,
    comp: tareas.filter(x => x.categoria_id === c.id && x.estado === "completada").length,
  })).filter(c => c.total > 0).sort((a, b) => b.comp - a.comp);

  const mejorCat = catStats[0];

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, color: "#4b2d8a", fontWeight: 800 }}>Mi Progreso</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Hoy", val: hoyComp.length, total: hoyTot.length, pct: pctH, color: "#a78bfa" },
          { label: "Semana", val: semComp.length, total: semTot.length, pct: pctS, color: "#60a5fa" },
          { label: "Mes", val: mesComp.length, total: mesTot.length, pct: pctM, color: "#34d399" },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>de {s.total}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.pct}%</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#4b2d8a" }}>📈 Cumplimiento</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ProgressBar value={pctH} color="#a78bfa" label="Hoy" />
          <ProgressBar value={pctS} color="#60a5fa" label="Esta semana" />
          <ProgressBar value={pctM} color="#34d399" label="Este mes" />
        </div>
      </Card>
      {catStats.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#4b2d8a" }}>🏷️ Por categoría</p>
          {catStats.map(c => (
            <div key={c.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{c.icono} {c.nombre}</span>
                <span style={{ color: "#9ca3af" }}>{c.comp}/{c.total}</span>
              </div>
              <ProgressBar value={c.total ? Math.round((c.comp / c.total) * 100) : 0} color={c.color} />
            </div>
          ))}
        </Card>
      )}
      {mejorCat && (
        <Card style={{ marginBottom: 16, background: "#f5f0ff", border: "1.5px solid #a78bfa" }}>
          <p style={{ margin: 0, fontSize: 14, color: "#4b2d8a" }}>🏆 Mejor categoría: <strong>{mejorCat.icono} {mejorCat.nombre}</strong> — {mejorCat.comp} completadas</p>
        </Card>
      )}
      {vencidas.length > 0 && (
        <Card style={{ border: "1.5px solid #fecaca" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#dc2626", fontSize: 14 }}>⚠️ {vencidas.length} tarea{vencidas.length !== 1 ? "s" : ""} atrasada{vencidas.length !== 1 ? "s" : ""}</p>
          {vencidas.slice(0, 5).map(t => (
            <div key={t.id} style={{ fontSize: 13, color: "#374151", padding: "4px 0", borderBottom: "1px solid #fef2f2" }}>
              {t.titulo} <span style={{ color: "#f87171" }}>({fmt(t.fecha)})</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Configuracion({ user, cats, userId, reload, onLogout }) {
  const [newCat, setNewCat] = useState({ nombre: "", color: "#a78bfa", icono: "📌" });
  const [saving, setSaving] = useState(false);
  const [firstTime, setFirstTime] = useState(false);

  useEffect(() => { if (cats.length === 0) setFirstTime(true); }, [cats]);

  const crearCatsDefault = async () => {
    setSaving(true);
    for (const c of CATS_DEFAULT) {
      await db.insert("agenda_categorias", { ...c, user_id: userId }).catch(() => {});
    }
    await reload();
    setSaving(false);
    setFirstTime(false);
  };

  const addCat = async () => {
    if (!newCat.nombre.trim()) return;
    setSaving(true);
    await db.insert("agenda_categorias", { ...newCat, user_id: userId });
    setNewCat({ nombre: "", color: "#a78bfa", icono: "📌" });
    await reload();
    setSaving(false);
  };

  const delCat = async (id) => {
    if (!window.confirm("¿Eliminar categoría?")) return;
    await db.delete("agenda_categorias", `id=eq.${id}`);
    await reload();
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, color: "#4b2d8a", fontWeight: 800 }}>Configuración</h2>
      <Card style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#4b2d8a" }}>👤 Tu cuenta</p>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>{user?.email}</p>
        <Btn onClick={onLogout} variant="danger" size="sm" style={{ marginTop: 12 }}>Cerrar sesión</Btn>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#4b2d8a" }}>🏷️ Categorías</p>
        {firstTime && (
          <div style={{ background: "#f5f0ff", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px" }}>¿Querés cargar las categorías predeterminadas?</p>
            <Btn onClick={crearCatsDefault} disabled={saving} variant="secondary" size="sm">Cargar categorías predeterminadas</Btn>
          </div>
        )}
        {cats.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f9f5ff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.color, display: "inline-block" }} />
              <span style={{ fontSize: 14 }}>{c.icono} {c.nombre}</span>
            </div>
            <button onClick={() => delCat(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16 }}>×</button>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>Nueva categoría</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Input placeholder="Nombre" value={newCat.nombre} onChange={e => setNewCat(n => ({ ...n, nombre: e.target.value }))} />
            </div>
            <input type="color" value={newCat.color} onChange={e => setNewCat(n => ({ ...n, color: e.target.value }))} style={{ width: 36, height: 36, borderRadius: 8, border: "1.5px solid #e5e7eb", cursor: "pointer", marginBottom: 12 }} />
            <Input placeholder="Ícono" value={newCat.icono} onChange={e => setNewCat(n => ({ ...n, icono: e.target.value }))} style={{ width: 60 }} />
          </div>
          <Btn onClick={addCat} disabled={saving} variant="secondary" size="sm">Agregar</Btn>
        </div>
      </Card>
    </div>
  );
}

function NavBar({ active, onChange }) {
  const items = [
    { id: "dashboard", icon: "🏠", label: "Inicio" },
    { id: "agenda", icon: "📅", label: "Agenda" },
    { id: "tareas", icon: "📋", label: "Tareas" },
    { id: "progreso", icon: "📊", label: "Progreso" },
    { id: "config", icon: "⚙️", label: "Config" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #f3f0ff", display: "flex", zIndex: 100, boxShadow: "0 -4px 20px rgba(167,139,250,.12)" }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onChange(it.id)} style={{ flex: 1, padding: "10px 0", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 20 }}>{it.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === it.id ? 700 : 400, color: active === it.id ? "#7c3aed" : "#9ca3af" }}>{it.label}</span>
          {active === it.id && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#7c3aed" }} />}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => getSession()?.user || null);
  const [screen, setScreen] = useState("dashboard");
  const [modalNew, setModalNew] = useState(false);
  const [newFecha, setNewFecha] = useState(today());
  const [selectedTarea, setSelectedTarea] = useState(null);

  const { tareas, cats, loading, reload, progreso } = useAgenda(user?.id);

  const handleLogin = (u) => setUser(u);
  const handleLogout = async () => { await authSignOut(); setUser(null); };

  const openNew = (fecha = today()) => { setNewFecha(fecha); setModalNew(true); };
  const openTarea = (t) => setSelectedTarea(t);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#faf8ff", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>📅</div>
            <p style={{ color: "#a78bfa", fontWeight: 600 }}>Cargando tu agenda…</p>
          </div>
        </div>
      )}
      {screen === "dashboard" && <Dashboard tareas={tareas} cats={cats} userId={user.id} progreso={progreso} onNewTask={openNew} onSelect={openTarea} />}
      {screen === "agenda" && <Agenda tareas={tareas} cats={cats} onSelect={openTarea} onNew={openNew} />}
      {screen === "tareas" && <MisTareas tareas={tareas} cats={cats} userId={user.id} progreso={progreso} onNew={openNew} onSelect={openTarea} reload={reload} />}
      {screen === "progreso" && <MiProgreso tareas={tareas} cats={cats} />}
      {screen === "config" && <Configuracion user={user} cats={cats} userId={user.id} reload={reload} onLogout={handleLogout} />}
      <NavBar active={screen} onChange={setScreen} />
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nueva tarea">
        <TareaForm cats={cats} userId={user.id} tarea={{ fecha: newFecha }} onSave={() => { setModalNew(false); reload(); }} onClose={() => setModalNew(false)} />
      </Modal>
      <Modal open={!!selectedTarea} onClose={() => setSelectedTarea(null)} title="Detalle de tarea">
        {selectedTarea && <TareaDetalle tarea={selectedTarea} cats={cats} userId={user.id} onClose={() => setSelectedTarea(null)} onReload={() => { reload(); setSelectedTarea(null); }} />}
      </Modal>
    </div>
  );
}
