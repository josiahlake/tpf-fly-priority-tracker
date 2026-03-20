const SUPABASE_URL = "https://feiwyhjfepbfvawbbodk.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sb = {
  from: (table) => ({
    select: async (cols = "*") => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&order=created_at.asc`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      return res.json();
    },
    insert: async (data) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    update: async (data, matchCol, matchVal) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${matchCol}=eq.${matchVal}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    delete: async (matchCol, matchVal) => {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?${matchCol}=eq.${matchVal}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
    },
  }),
};

import { useState, useEffect } from "react";

const TEAM_MEMBERS = ["Ov", "Laurie", "Marco", "Max", "Serena", "Josiah"];
const BUSINESSES = ["FLY", "TPF", "Support"];
const STATUS_OPTIONS = ["Not Started", "In Progress", "Done", "Cancelled"];
const PRIORITY_OPTIONS = ["HI", "MID", "LOW"];

const QUADRANTS = [
  { id: "do",        label: "DO NOW",    action: "DO",    sub: "High Importance · High Urgency",  color: "#0f766e", bg: "#ccfbf1", border: "#5eead4", light: "#f0fdf9" },
  { id: "schedule",  label: "SCHEDULE",  action: "PLAN",  sub: "High Importance · Low Urgency",   color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", light: "#eff6ff" },
  { id: "delegate",  label: "DELEGATE",  action: "ASSIGN",sub: "Low Importance · High Urgency",   color: "#b45309", bg: "#fef3c7", border: "#fcd34d", light: "#fffbeb" },
  { id: "eliminate", label: "ELIMINATE", action: "DROP",  sub: "Low Importance · Low Urgency",    color: "#9f1239", bg: "#ffe4e6", border: "#fda4af", light: "#fff1f2" },
];

const BIZ_COLORS = { FLY: { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" }, TPF: { bg:"#f5f3ff", color:"#6d28d9", border:"#ddd6fe" }, Support: { bg:"#f0fdf4", color:"#166534", border:"#bbf7d0" } };
const STATUS_STYLES = { "Not Started":{ bg:"#f1f5f9", color:"#475569" }, "In Progress":{ bg:"#fef9c3", color:"#92400e" }, Done:{ bg:"#dcfce7", color:"#166534" }, Cancelled:{ bg:"#f1f5f9", color:"#9ca3af" } };
const PRIORITY_STYLES = { HI:{ bg:"#fee2e2", color:"#991b1b" }, MID:{ bg:"#fef3c7", color:"#92400e" }, LOW:{ bg:"#dcfce7", color:"#166534" } };

function genId() { return Math.random().toString(36).slice(2,9); }
function getWeekLabel() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return "Week of " + d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function injectPrintStyles() {
  if (document.getElementById("tpf-print-styles")) return;
  const style = document.createElement("style");
  style.id = "tpf-print-styles";
  style.textContent = ".no-print { } @media print { .no-print { display: none !important; } body { background: white !important; } * { box-shadow: none !important; } }";
  document.head.appendChild(style);
}

function Tag({ label, style }) {
  return <span style={{ ...style, fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"99px", letterSpacing:"0.04em", whiteSpace:"nowrap", textTransform:"uppercase" }}>{label}</span>;
}

function SubtaskList({ subtasks, onChange }) {
  const [newText, setNewText] = useState("");
  const toggle = (id) => onChange(subtasks.map(s => s.id===id ? {...s,done:!s.done} : s));
  const remove = (id) => onChange(subtasks.filter(s => s.id!==id));
  const add = () => { if (newText.trim()) { onChange([...subtasks, {id:genId(),text:newText.trim(),done:false}]); setNewText(""); } };
  const pct = subtasks.length ? Math.round(subtasks.filter(s=>s.done).length/subtasks.length*100) : 0;
  return (
    <div style={{marginTop:"10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>Subtasks ({subtasks.filter(s=>s.done).length}/{subtasks.length})</span>
        {subtasks.length>0 && <span style={{fontSize:"11px",fontWeight:700,color:pct===100?"#166534":"#b45309"}}>{pct}%</span>}
      </div>
      {subtasks.length>0 && <div style={{height:"4px",background:"#e2e8f0",borderRadius:"99px",marginBottom:"8px",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:pct===100?"#22c55e":"#3b82f6",borderRadius:"99px",transition:"width 0.3s"}}/></div>}
      {subtasks.map(s=>(<div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:"6px",marginBottom:"5px"}}><input type="checkbox" checked={s.done} onChange={()=>toggle(s.id)} style={{marginTop:"2px",cursor:"pointer",accentColor:"#0f766e"}}/><span style={{flex:1,fontSize:"12px",color:s.done?"#94a3b8":"#334155",textDecoration:s.done?"line-through":"none",lineHeight:1.4}}>{s.text}</span><button onClick={()=>remove(s.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#64748b",padding:"0 2px"}}>x</button></div>))}
      <div style={{display:"flex",gap:"4px",marginTop:"6px"}}>
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add actionable subtask..." style={{flex:1,fontSize:"12px",border:"1px dashed #cbd5e1",borderRadius:"6px",padding:"4px 8px",outline:"none",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b"}}/>
        <button onClick={add} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>+</button>
      </div>
    </div>
  );
}

function TaskCard({ task, quadrant, onUpdate, onDelete, onMove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [expanded, setExpanded] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const save = () => { if (draft.trim()) onUpdate({...task, text:draft.trim(), updated_at:new Date().toISOString()}); setEditing(false); };
  const ss = STATUS_STYLES[task.status]||STATUS_STYLES["Not Started"];
  const ps = PRIORITY_STYLES[task.priority]||PRIORITY_STYLES["MID"];
  const bs = BIZ_COLORS[task.biz]||BIZ_COLORS["FLY"];
  const subtaskPct = task.subtasks?.length ? Math.round(task.subtasks.filter(s=>s.done).length/task.subtasks.length*100) : null;
  return (
    <div style={{background:"#ffffff",color:"#1e293b",border:"1.5px solid "+quadrant.border,borderRadius:"10px",padding:"10px 12px",marginBottom:"7px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 10px rgba(0,0,0,0.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.06)"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
          <Tag label={task.biz} style={{background:bs.bg,color:bs.color}}/>
          <Tag label={task.priority} style={{background:ps.bg,color:ps.color}}/>
          {task.subtasks?.length>0 && <Tag label={task.subtasks.filter(s=>s.done).length+"/"+task.subtasks.length+" steps"} style={{background:subtaskPct===100?"#dcfce7":"#f1f5f9",color:subtaskPct===100?"#166534":"#64748b"}}/>}
        </div>
        <div className="no-print" style={{display:"flex",gap:"2px"}}>
          <button onClick={()=>setExpanded(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#94a3b8",padding:"1px 3px"}} title="Expand for notes">{expanded?"▲":"▼"}</button>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowMove(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#94a3b8",padding:"1px 3px"}}>⇄</button>
            {showMove && <div style={{position:"absolute",right:0,top:"20px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"4px",zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.12)",minWidth:"120px"}}>{QUADRANTS.filter(q=>q.id!==quadrant.id).map(q=>(<button key={q.id} onClick={()=>{onMove(q.id);setShowMove(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",padding:"5px 8px",fontSize:"11px",cursor:"pointer",borderRadius:"5px",color:q.color,fontWeight:700}} onMouseEnter={e=>e.currentTarget.style.background=q.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}>→ {q.label}</button>))}</div>}
          </div>
          <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#94a3b8",padding:"1px 3px"}}>x</button>
        </div>
      </div>
      {editing
        ? <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={save} onKeyDown={e=>e.key==="Enter"&&save()} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",outline:"none",fontSize:"13px",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b",padding:"4px 6px",marginBottom:"6px",boxSizing:"border-box"}}/>
        : <div onClick={()=>setEditing(true)} style={{fontSize:"13px",fontWeight:500,color:"#1e293b",cursor:"text",lineHeight:1.4,marginBottom:"5px",minHeight:"18px"}}>{task.text}</div>
      }
      {task.subtasks?.length>0 && !expanded && <div style={{height:"3px",background:"#e2e8f0",borderRadius:"99px",marginBottom:"5px",overflow:"hidden"}}><div style={{height:"100%",width:(subtaskPct||0)+"%",background:subtaskPct===100?"#22c55e":"#3b82f6",borderRadius:"99px"}}/></div>}
      <div style={{display:"flex",gap:"5px",alignItems:"center",flexWrap:"wrap"}}>
        <Tag label={task.status} style={{background:ss.bg,color:ss.color}}/>
        {task.assignee && <span style={{fontSize:"11px",color:"#64748b",fontWeight:500}}>👤 {task.assignee}</span>}
        {task.due && <span style={{fontSize:"11px",color:"#64748b"}}>📅 {task.due}</span>}
        {task.updated_at && <span style={{fontSize:"10px",color:"#94a3b8",marginLeft:"auto"}}>✏️ {formatDateTime(task.updated_at)}{task.updated_by?" · "+task.updated_by:""}</span>}
      </div>
      {expanded && (
        <div style={{marginTop:"10px",paddingTop:"10px",borderTop:"1px solid "+quadrant.border}}>
          <div style={{marginBottom:"10px",background:quadrant.light,borderRadius:"8px",padding:"8px 10px"}}>
            <label style={{fontSize:"10px",color:quadrant.color,fontWeight:800,textTransform:"uppercase",display:"block",marginBottom:"4px",letterSpacing:"0.08em"}}>📝 Notes / Updates</label>
            <textarea value={task.notes||""} onChange={e=>onUpdate({...task,notes:e.target.value,updated_at:new Date().toISOString()})} placeholder="Add notes, updates, links, or context here..." rows={3} style={{fontSize:"12px",border:"1px solid "+quadrant.border,borderRadius:"6px",padding:"5px 8px",fontFamily:"inherit",width:"100%",boxSizing:"border-box",resize:"vertical",background:"#fff",color:"#1e293b",lineHeight:1.5}}/>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
            {[{label:"Status",value:task.status,opts:STATUS_OPTIONS,key:"status"},{label:"Priority",value:task.priority,opts:PRIORITY_OPTIONS,key:"priority"},{label:"Business",value:task.biz,opts:BUSINESSES,key:"biz"},{label:"Assignee",value:task.assignee||"",opts:["", ...TEAM_MEMBERS],key:"assignee"},{label:"Updated By",value:task.updated_by||"",opts:["", ...TEAM_MEMBERS],key:"updated_by"}].map(f=>(
              <div key={f.key} style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                <label style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>{f.label}</label>
                <select value={f.value} onChange={e=>onUpdate({...task,[f.key]:e.target.value,updated_at:new Date().toISOString()})} style={{fontSize:"12px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"3px 6px",fontFamily:"inherit",color:"#1e293b",background:"#fff"}}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
            <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
              <label style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Due Date</label>
              <input type="date" value={task.due||""} onChange={e=>onUpdate({...task,due:e.target.value,updated_at:new Date().toISOString()})} style={{fontSize:"12px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"3px 6px",fontFamily:"inherit",color:"#1e293b",background:"#fff"}}/>
            </div>
          </div>
          <SubtaskList subtasks={task.subtasks||[]} onChange={subs=>onUpdate({...task,subtasks:subs,updated_at:new Date().toISOString()})}/>
          {task.updated_at && <div style={{marginTop:"8px",fontSize:"10px",color:"#94a3b8",textAlign:"right"}}>Last updated: {formatDateTime(task.updated_at)}{task.updated_by?" by "+task.updated_by:""}</div>}
        </div>
      )}
    </div>
  );
}

function AddTaskRow({ quadrant, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [biz, setBiz] = useState("FLY");
  const defaultPriority = {do:"HI",schedule:"HI",delegate:"MID",eliminate:"LOW"}[quadrant.id];
  const submit = () => { if (text.trim()) { onAdd({text:text.trim(),assignee,biz,priority:defaultPriority,status:"Not Started",due:"",notes:"",subtasks:[],updated_at:new Date().toISOString(),updated_by:""}); setText("");setAssignee("");setBiz("FLY");setOpen(false); } };
  if (!open) return <button onClick={()=>setOpen(true)} style={{width:"100%",background:"none",border:"1.5px dashed "+quadrant.border,borderRadius:"8px",padding:"8px",fontSize:"12px",color:quadrant.color,cursor:"pointer",fontWeight:600,marginTop:"4px"}} onMouseEnter={e=>e.currentTarget.style.background=quadrant.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}>+ Add task</button>;
  return (
    <div style={{background:"#fff",border:"1.5px solid "+quadrant.border,borderRadius:"10px",padding:"10px",marginTop:"4px"}}>
      <input autoFocus value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Task description..." style={{width:"100%",border:"1.5px solid "+quadrant.border,borderRadius:"7px",padding:"6px 10px",fontSize:"13px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"6px",color:"#1e293b",background:"#fff"}}/>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
        <select value={assignee} onChange={e=>setAssignee(e.target.value)} style={{fontSize:"12px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"4px 6px",fontFamily:"inherit",color:"#1e293b",background:"#fff"}}><option value="">Assignee</option>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
        <select value={biz} onChange={e=>setBiz(e.target.value)} style={{fontSize:"12px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"4px 6px",fontFamily:"inherit",color:"#1e293b",background:"#fff"}}>{BUSINESSES.map(b=><option key={b}>{b}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={submit} style={{background:quadrant.color,color:"#fff",border:"none",borderRadius:"7px",padding:"5px 14px",fontSize:"12px",cursor:"pointer",fontWeight:700}}>Add</button>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"12px"}}>Cancel</button>
      </div>
    </div>
  );
}

function QuadrantPanel({ quadrant, tasks, onAdd, onUpdate, onDelete, onMove }) {
  const active = tasks.filter(t=>t.status!=="Done"&&t.status!=="Cancelled");
  const done = tasks.filter(t=>t.status==="Done");
  const cancelled = tasks.filter(t=>t.status==="Cancelled");
  return (
    <div style={{background:quadrant.bg,border:"2px solid "+quadrant.border,borderRadius:"14px",padding:"14px",display:"flex",flexDirection:"column",minHeight:"280px"}}>
      <div style={{marginBottom:"12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:800,letterSpacing:"0.14em",color:quadrant.color,textTransform:"uppercase"}}>{quadrant.action}</div>
            <div style={{fontSize:"17px",fontWeight:800,color:quadrant.color,letterSpacing:"-0.02em",lineHeight:1.1}}>{quadrant.label}</div>
            <div style={{fontSize:"11px",color:quadrant.color,opacity:0.7,marginTop:"2px"}}>{quadrant.sub}</div>
          </div>
          <div style={{background:quadrant.color,color:"#fff",borderRadius:"99px",minWidth:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:800,padding:"0 8px"}}>{active.length}</div>
        </div>
        <div style={{height:"2px",background:quadrant.border,borderRadius:"2px",marginTop:"10px"}}/>
      </div>
      <div style={{flex:1}}>{active.map(task=>(<TaskCard key={task.id} task={task} quadrant={quadrant} onUpdate={t=>onUpdate(quadrant.id,t)} onDelete={id=>onDelete(quadrant.id,id)} onMove={toId=>onMove(quadrant.id,task.id,toId)}/>))}</div>
      {done.length>0 && <details style={{marginTop:"4px"}}><summary style={{fontSize:"11px",color:quadrant.color,cursor:"pointer",fontWeight:600,opacity:0.7}}>✓ {done.length} completed</summary><div style={{opacity:0.6,marginTop:"4px"}}>{done.map(task=>(<TaskCard key={task.id} task={task} quadrant={quadrant} onUpdate={t=>onUpdate(quadrant.id,t)} onDelete={id=>onDelete(quadrant.id,id)} onMove={toId=>onMove(quadrant.id,task.id,toId)}/>))}</div></details>}
      {cancelled.length>0 && <details style={{marginTop:"4px"}}><summary style={{fontSize:"11px",color:"#64748b",cursor:"pointer",fontWeight:600,opacity:0.7}}>✕ {cancelled.length} cancelled</summary><div style={{opacity:0.5,marginTop:"4px"}}>{cancelled.map(task=>(<TaskCard key={task.id} task={task} quadrant={quadrant} onUpdate={t=>onUpdate(quadrant.id,t)} onDelete={id=>onDelete(quadrant.id,id)} onMove={toId=>onMove(quadrant.id,task.id,toId)}/>))}</div></details>}
      <div className="no-print"><AddTaskRow quadrant={quadrant} onAdd={data=>onAdd(quadrant.id,data)}/></div>
    </div>
  );
}

function WeekHistoryView({ history, onClose }) {
  const [sel, setSel] = useState(history.length-1);
  const week = history[sel];
  if (!week) return null;
  const all = Object.values(week.tasks).flat();
  const done=all.filter(t=>t.status==="Done"), cancelled=all.filter(t=>t.status==="Cancelled");
  const inProg=all.filter(t=>t.status==="In Progress"), notStarted=all.filter(t=>t.status==="Not Started");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",color:"#1e293b",borderRadius:"16px",width:"100%",maxWidth:"820px",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <div style={{padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0f172a",borderRadius:"16px 16px 0 0"}}>
          <div><div style={{fontSize:"18px",fontWeight:800,color:"#fff"}}>Week-Over-Week History</div><div style={{fontSize:"12px",color:"#94a3b8",marginTop:"2px"}}>Stored permanently in Supabase database</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"20px"}}>x</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #e2e8f0",overflowX:"auto",padding:"0 16px",background:"#f8fafc"}}>{history.map((w,i)=>(<button key={i} onClick={()=>setSel(i)} style={{padding:"10px 16px",border:"none",background:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,whiteSpace:"nowrap",color:sel===i?"#0f172a":"#94a3b8",borderBottom:sel===i?"2px solid #0f172a":"2px solid transparent"}}>{w.label}{i===history.length-1?" (current)":""}</button>))}</div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <div style={{display:"flex",gap:"10px",marginBottom:"20px",flexWrap:"wrap"}}>{[{label:"Done",items:done,color:"#166534",bg:"#dcfce7"},{label:"In Progress",items:inProg,color:"#92400e",bg:"#fef9c3"},{label:"Cancelled",items:cancelled,color:"#6b7280",bg:"#f3f4f6"},{label:"Not Started",items:notStarted,color:"#475569",bg:"#f1f5f9"}].map(s=>(<div key={s.label} style={{background:s.bg,borderRadius:"10px",padding:"10px 16px",minWidth:"80px",textAlign:"center"}}><div style={{fontSize:"22px",fontWeight:800,color:s.color}}>{s.items.length}</div><div style={{fontSize:"11px",color:s.color,fontWeight:700}}>{s.label}</div></div>))}</div>
          {[{label:"Completed",items:done,color:"#166534",bg:"#f0fdf4",border:"#bbf7d0"},{label:"Still In Progress",items:inProg,color:"#92400e",bg:"#fffbeb",border:"#fcd34d"},{label:"Cancelled",items:cancelled,color:"#6b7280",bg:"#f9fafb",border:"#e5e7eb"}].map(section=>(section.items.length>0 && <div key={section.label} style={{marginBottom:"18px"}}><div style={{fontSize:"13px",fontWeight:800,color:section.color,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.08em"}}>{section.label}</div>{section.items.map(t=>(<div key={t.id} style={{background:section.bg,border:"1px solid "+section.border,borderRadius:"8px",padding:"8px 12px",marginBottom:"5px",color:"#1e293b"}}><div style={{fontSize:"13px",fontWeight:500}}>{t.text}</div><div style={{display:"flex",gap:"6px",marginTop:"3px",flexWrap:"wrap"}}><Tag label={t.biz} style={{background:BIZ_COLORS[t.biz]?.bg,color:BIZ_COLORS[t.biz]?.color}}/>{t.assignee&&<span style={{fontSize:"11px",color:"#64748b"}}>👤 {t.assignee}</span>}{t.updated_at&&<span style={{fontSize:"10px",color:"#94a3b8"}}>✏️ {formatDateTime(t.updated_at)}{t.updated_by?" · "+t.updated_by:""}</span>}{t.notes&&<span style={{fontSize:"11px",color:"#64748b",fontStyle:"italic"}}>"{t.notes.substring(0,60)}{t.notes.length>60?"...":""}"</span>}</div></div>))}</div>))}
        </div>
      </div>
    </div>
  );
}

function WeeklyResetModal({ tasks, currentWeek, onConfirm, onCancel }) {
  const all = Object.values(tasks).flat();
  const done=all.filter(t=>t.status==="Done").length;
  const cancelled=all.filter(t=>t.status==="Cancelled").length;
  const active=all.filter(t=>t.status==="In Progress"||t.status==="Not Started").length;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",color:"#1e293b",borderRadius:"16px",width:"100%",maxWidth:"480px",padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <div style={{fontSize:"22px",fontWeight:800,marginBottom:"4px"}}>🔄 Start New Week</div>
        <div style={{fontSize:"13px",color:"#64748b",marginBottom:"20px"}}>Archive <strong>{currentWeek}</strong> and reset for the next week.</div>
        <div style={{display:"flex",gap:"10px",marginBottom:"20px"}}>{[{label:"Will be archived",value:done,color:"#166534",bg:"#dcfce7",sub:"Done tasks"},{label:"Auto carry forward",value:active,color:"#1d4ed8",bg:"#dbeafe",sub:"Not Started + In Progress"},{label:"Will be archived",value:cancelled,color:"#6b7280",bg:"#f3f4f6",sub:"Cancelled tasks"}].map(s=>(<div key={s.sub} style={{flex:1,background:s.bg,borderRadius:"10px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"24px",fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:"10px",color:s.color,fontWeight:700}}>{s.sub}</div></div>))}</div>
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"10px",padding:"12px 14px",marginBottom:"20px",fontSize:"12px",color:"#64748b",lineHeight:1.6}}>
          <strong style={{color:"#0f172a"}}>What happens on reset:</strong><br/>
          Done + Cancelled tasks archived. Not Started + In Progress carry forward. Board date updates.
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={onConfirm} style={{flex:1,background:"#0f172a",color:"#fff",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",cursor:"pointer",fontWeight:700}}>✓ Reset & Start New Week</button>
          <button onClick={onCancel} style={{background:"none",border:"1.5px solid #e2e8f0",borderRadius:"10px",padding:"12px 18px",fontSize:"14px",cursor:"pointer",color:"#64748b",fontWeight:600}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_BOARD = { do:[], schedule:[], delegate:[], eliminate:[] };

export default function App() {
  const [tasks, setTasks] = useState(EMPTY_BOARD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(getWeekLabel());
  const [history, setHistory] = useState([]);
  const [memberFilter, setMemberFilter] = useState("All");
  const [bizFilter, setBizFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    injectPrintStyles();
    const load = async () => {
      try {
        const data = await sb.from("tasks").select("*");
        if (data?.error) { setError("Could not connect. Check your Supabase keys."); setLoading(false); return; }
        const board = { do:[], schedule:[], delegate:[], eliminate:[] };
        (data||[]).filter(t=>!t.archived).forEach(t => { if (board[t.quadrant]) board[t.quadrant].push({...t, subtasks: t.subtasks||[]}); });
        setTasks(board);
      } catch(e) { setError("Connection failed. Check your Supabase URL and key."); }
      setLoading(false);
    };
    load();
  }, []);

  const addTask = async (qId, data) => {
    const newTask = { ...data, quadrant: qId, week_label: currentWeek, archived: false };
    // Optimistically add to UI immediately with full data
    const tempId = genId();
    const optimisticTask = { ...newTask, id: tempId, subtasks: newTask.subtasks || [] };
    setTasks(prev => ({...prev, [qId]: [...prev[qId], optimisticTask]}));
    setSaving(true);
    try {
      const result = await sb.from("tasks").insert(newTask);
      const saved = Array.isArray(result) ? result[0] : result;
      if (saved && saved.id) {
        // Replace temp task with real saved task, keeping original text if DB returns empty
        setTasks(prev => ({...prev, [qId]: prev[qId].map(t => t.id===tempId ? {...newTask, ...saved, text: saved.text || newTask.text, subtasks: saved.subtasks || newTask.subtasks || []} : t)}));
      }
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const updateTask = async (qId, updated) => {
    setTasks(prev => ({...prev, [qId]: prev[qId].map(t=>t.id===updated.id?updated:t)}));
    try { await sb.from("tasks").update(updated, "id", updated.id); } catch(e) { console.error(e); }
  };

  const deleteTask = async (qId, id) => {
    setTasks(prev => ({...prev, [qId]: prev[qId].filter(t=>t.id!==id)}));
    try { await sb.from("tasks").delete("id", id); } catch(e) { console.error(e); }
  };

  const moveTask = async (fromId, taskId, toId) => {
    const task = tasks[fromId].find(t=>t.id===taskId);
    if (!task) return;
    setTasks(prev => ({...prev, [fromId]: prev[fromId].filter(t=>t.id!==taskId), [toId]: [...prev[toId], {...task, quadrant: toId}]}));
    try { await sb.from("tasks").update({quadrant: toId}, "id", taskId); } catch(e) { console.error(e); }
  };

  const handleReset = async () => {
    setHistory(prev => [...prev, {label: currentWeek, tasks: JSON.parse(JSON.stringify(tasks))}]);
    const carry = {};
    QUADRANTS.forEach(q => { carry[q.id] = tasks[q.id].filter(t=>t.status==="Not Started"||t.status==="In Progress"); });
    for (const t of Object.values(tasks).flat().filter(t=>t.status==="Done"||t.status==="Cancelled")) {
      try { await sb.from("tasks").update({archived:true}, "id", t.id); } catch(e) {}
    }
    setTasks(carry);
    setCurrentWeek(getWeekLabel());
    setShowReset(false);
  };

  const filtered = (qId) => tasks[qId].filter(t => {
    if (memberFilter!=="All" && t.assignee!==memberFilter) return false;
    if (bizFilter!=="All" && t.biz!==bizFilter) return false;
    if (statusFilter!=="All" && t.status!==statusFilter) return false;
    if (search && !t.text?.toLowerCase().includes(search.toLowerCase()) && !t.assignee?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const allTasks = Object.values(tasks).flat();
  const FilterBtn = ({value, current, onClick, label}) => <button onClick={onClick} style={{border:"1.5px solid #e2e8f0",borderRadius:"7px",padding:"4px 10px",fontSize:"12px",cursor:"pointer",fontWeight:600,background:current===value?"#0f172a":"#fff",color:current===value?"#fff":"#475569",transition:"all 0.15s",whiteSpace:"nowrap"}}>{label||value}</button>;

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc",fontFamily:"system-ui",color:"#1e293b"}}><div style={{textAlign:"center"}}><div style={{fontSize:"32px",marginBottom:"12px"}}>⏳</div><div style={{fontSize:"16px",fontWeight:700}}>Loading Priority Matrix...</div></div></div>;
  if (error) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc",fontFamily:"system-ui"}}><div style={{textAlign:"center",maxWidth:"480px",padding:"32px",background:"#fff",borderRadius:"16px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",color:"#1e293b"}}><div style={{fontSize:"32px",marginBottom:"12px"}}>⚠️</div><div style={{fontSize:"16px",fontWeight:700,marginBottom:"8px"}}>Database Connection Error</div><div style={{fontSize:"13px",color:"#64748b",marginBottom:"16px"}}>{error}</div></div></div>;

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:"#f8fafc",padding:"18px 20px 40px",boxSizing:"border-box",color:"#1e293b"}}>
      {showReset && <WeeklyResetModal tasks={tasks} currentWeek={currentWeek} onConfirm={handleReset} onCancel={()=>setShowReset(false)}/>}
      {showHistory && <WeekHistoryView history={[...history,{label:currentWeek+" (current)",tasks}]} onClose={()=>setShowHistory(false)}/>}
      <div style={{maxWidth:"1180px",margin:"0 auto"}}>
        <div style={{marginBottom:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <div style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"6px"}}>
                {["FLY","TPF"].map(b=>(<span key={b} style={{background:BIZ_COLORS[b].bg,color:BIZ_COLORS[b].color,border:"1.5px solid "+BIZ_COLORS[b].border,borderRadius:"6px",padding:"2px 10px",fontSize:"11px",fontWeight:800,letterSpacing:"0.08em"}}>{b}</span>))}
                {saving && <span style={{fontSize:"11px",background:"#fef9c3",color:"#92400e",borderRadius:"99px",padding:"2px 8px",fontWeight:600}}>💾 Saving...</span>}
                {history.length>0 && <span style={{fontSize:"11px",background:"#f1f5f9",color:"#64748b",borderRadius:"99px",padding:"2px 8px",fontWeight:600}}>{history.length} week{history.length>1?"s":""} archived</span>}
              </div>
              <div style={{fontSize:"16px",fontWeight:800,color:"#1d4ed8",letterSpacing:"0.01em",marginBottom:"3px"}}>📅 {currentWeek}</div>
              <h1 style={{margin:0,fontSize:"26px",fontWeight:800,color:"#0f172a",letterSpacing:"-0.03em"}}>Priority Matrix</h1>
              <p style={{margin:"2px 0 0",fontSize:"12px",color:"#64748b"}}>Not Started & In Progress tasks auto-carry each week.</p>
            </div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
              {[{label:"Do Now",value:tasks.do.filter(t=>t.status!=="Done"&&t.status!=="Cancelled").length,color:"#0f766e",bg:"#ccfbf1"},{label:"In Progress",value:allTasks.filter(t=>t.status==="In Progress").length,color:"#b45309",bg:"#fef3c7"},{label:"Active",value:allTasks.filter(t=>t.status!=="Done"&&t.status!=="Cancelled").length,color:"#1d4ed8",bg:"#dbeafe"},{label:"Done",value:allTasks.filter(t=>t.status==="Done").length,color:"#166534",bg:"#dcfce7"}].map(s=>(<div key={s.label} style={{background:s.bg,borderRadius:"10px",padding:"6px 12px",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:"10px",color:s.color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:"1px"}}>{s.label}</div></div>))}
              <div className="no-print" style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                <button onClick={()=>setShowHistory(true)} style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>📊 View History</button>
                <div style={{display:"flex",gap:"4px"}}>
                  <button onClick={()=>setShowReset(true)} style={{flex:1,background:"#0f172a",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",fontWeight:700}}>🔄 New Week</button>
                  <button onClick={()=>window.print()} style={{background:"#475569",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",fontWeight:700}} title="Print">🖨️</button>
                </div>
              </div>
            </div>
          </div>
          <div className="no-print" style={{display:"flex",gap:"8px",marginTop:"12px",flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search tasks..." style={{border:"1.5px solid #e2e8f0",borderRadius:"8px",padding:"5px 12px",fontSize:"13px",outline:"none",background:"#fff",color:"#1e293b",minWidth:"160px",fontFamily:"inherit"}}/>
            <div style={{display:"flex",gap:"4px",alignItems:"center"}}><span style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Team:</span><FilterBtn value="All" current={memberFilter} onClick={()=>setMemberFilter("All")}/>{TEAM_MEMBERS.map(m=><FilterBtn key={m} value={m} current={memberFilter} onClick={()=>setMemberFilter(m)} label={m}/>)}</div>
            <div style={{display:"flex",gap:"4px",alignItems:"center"}}><span style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Biz:</span>{["All",...BUSINESSES].map(b=><FilterBtn key={b} value={b} current={bizFilter} onClick={()=>setBizFilter(b)}/>)}</div>
            <div style={{display:"flex",gap:"4px",alignItems:"center"}}><span style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status:</span>{["All",...STATUS_OPTIONS].map(s=><FilterBtn key={s} value={s} current={statusFilter} onClick={()=>setStatusFilter(s)}/>)}</div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px",padding:"0 4px"}}>
          <span style={{fontSize:"10px",color:"#94a3b8",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>← Low Urgency</span>
          <span style={{fontSize:"10px",color:"#94a3b8",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>High Urgency →</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <QuadrantPanel quadrant={QUADRANTS[1]} tasks={filtered("schedule")} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} onMove={moveTask}/>
          <QuadrantPanel quadrant={QUADRANTS[0]} tasks={filtered("do")} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} onMove={moveTask}/>
          <QuadrantPanel quadrant={QUADRANTS[3]} tasks={filtered("eliminate")} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} onMove={moveTask}/>
          <QuadrantPanel quadrant={QUADRANTS[2]} tasks={filtered("delegate")} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} onMove={moveTask}/>
        </div>
        <div style={{textAlign:"center",marginTop:"8px"}}><span style={{fontSize:"10px",color:"#94a3b8",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>↑ High Importance   Low Importance ↓</span></div>
        <div className="no-print" style={{marginTop:"12px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:"10px",padding:"10px 16px",display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em"}}>Tips:</span>
          {[{icon:"✏️",text:"Click text to rename"},{icon:"▼",text:"Expand for notes & details"},{icon:"📝",text:"Notes field when expanded"},{icon:"✏️",text:"Tracks who edited & when"},{icon:"🔄",text:"Not Started + In Progress auto-carry"},{icon:"🖨️",text:"Print button for B&W printout"}].map(t=>(<span key={t.text} style={{fontSize:"12px",color:"#64748b"}}>{t.icon} {t.text}</span>))}
        </div>
      </div>
    </div>
  );
}
