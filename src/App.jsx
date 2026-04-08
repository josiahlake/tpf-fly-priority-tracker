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

import { useState, useEffect, useCallback, useRef } from "react";

const TEAM_MEMBERS = ["Ov", "Laurie", "Marco", "Max", "Serena", "Josiah"];
const BUSINESSES = ["FLY", "TPF", "Support"];
const STATUS_OPTIONS = ["Not Started", "In Progress", "Done", "Cancelled"];
const PRIORITY_OPTIONS = ["HI", "MID", "LOW"];

// ── CHANGE #1: Updated quadrant labels/headers ──────────────────────────────
const QUADRANTS = [
  {
    id: "do",
    label: "GAME WINNER",
    action: "EXECUTE UNDER PRESSURE",
    sub: "Hi Importance · Hi Urgency",
    tagline: "Clock's running out.",
    color: "#0f766e", bg: "#ccfbf1", border: "#5eead4", light: "#f0fdf9"
  },
  {
    id: "schedule",
    label: "SCOUTING REPORT",
    action: "PLANNED. INTENTIONAL. BUILDS ADVANTAGE.",
    sub: "Hi Importance · Lo Urgency",
    tagline: "",
    color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", light: "#eff6ff"
  },
  {
    id: "delegate",
    label: "SHOT SELECTION",
    action: "NOT EVERY SHOT IS A GOOD ONE.",
    sub: "Lo Importance · Hi Urgency",
    tagline: "",
    color: "#b45309", bg: "#fef3c7", border: "#fcd34d", light: "#fffbeb"
  },
  {
    id: "eliminate",
    label: "PRACTICE PLAYER",
    action: "USEFUL. SUPPORTS THE TEAM. NOT CRITICAL TO WIN.",
    sub: "Lo Importance · Lo Urgency",
    tagline: "",
    color: "#9f1239", bg: "#ffe4e6", border: "#fda4af", light: "#fff1f2"
  },
];

const BIZ_COLORS = { FLY: { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" }, TPF: { bg:"#f5f3ff", color:"#6d28d9", border:"#ddd6fe" }, Support: { bg:"#f0fdf4", color:"#166534", border:"#bbf7d0" } };
const STATUS_STYLES = { "Not Started":{ bg:"#f1f5f9", color:"#475569" }, "In Progress":{ bg:"#fef9c3", color:"#92400e" }, Done:{ bg:"#dcfce7", color:"#166534" }, Cancelled:{ bg:"#f1f5f9", color:"#9ca3af" } };
const PRIORITY_STYLES = { HI:{ bg:"#fee2e2", color:"#991b1b" }, MID:{ bg:"#fef3c7", color:"#92400e" }, LOW:{ bg:"#dcfce7", color:"#166534" } };

// ── Roles & Responsibilities data (CHANGE #8) ────────────────────────────────
const ROLES_DATA = {
  OV: {
    color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe",
    sections: {
      "\"PLAY\"": ["FLY ACADEMY GM — Lead Fly Academy Results", "COACHING LEAD — Hiring & Expectations", "COMPETITION LEAD — Games and Placements"],
      "\"TRAIN\"": ["TPF GM — Lead TPF Results", "AMBASSADOR LEAD — Develop TPF Ambassadors"],
      "\"SUPPORT\"": ["EVENT TRAVEL LEAD — Manage event travel & logistics", "STAFFING LEAD — Staffing for programs", "PAYROLL LEAD — Collect & Submit Payroll hours"],
    }
  },
  Marco: {
    color: "#0f766e", bg: "#f0fdf9", border: "#5eead4",
    sections: {
      "\"PLAY\"": ["BOYS FLY LEAD — P.E.A for Boys Fly program", "BOYS FLY ELIGIBILITY — Waivers & Payments", "FLY UNIFORMS — Uniform Management"],
      "\"TRAIN\"": ["DAILY PROGRAMS — Plan & Manage", "PRIVATE TRAININGS — Plan & Manage"],
      "\"SUPPORT\"": ["KENKO SYSTEM LEAD — Reporting & Schedule Updates", "STAFFING/COACHING SUPPORT — Staffing for programs"],
    }
  },
  Max: {
    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
    sections: {
      "\"PLAY\"": ["JR FLY LEAD — P.E.A for Jr Fly", "FLY CONTENT LEAD — Content & Editing"],
      "\"TRAIN\"": ["TPF CONTENT LEAD — Content & Editing"],
      "\"SUPPORT\"": ["YOUTUBE EXECUTION — Develop & Execute YT Strategy", "TIK TOK EXECUTION — Develop & Execute TT Strategy", "WEBSITE SUPPORT — Assist Josiah"],
    }
  },
  Laurie: {
    color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4",
    sections: {
      "\"PLAY\"": ["LADY FLY LEAD — P.E.A for Lady Fly program", "GIRLS FLY ELIGIBILITY — Waivers & Payments"],
      "\"TRAIN\"": ["TPF SOCIAL MEDIA — Content & Growth"],
      "\"SUPPORT\"": ["MARKETING LEAD — Planning & Execution", "RETAIL SUPPORT — Support Serena", "CREATIVE SUPPORT — Brand Visuals", "WEBSITE SUPPORT — Assist Josiah"],
    }
  },
  Josiah: {
    color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd",
    sections: {
      "\"PLAY\"": ["FLY WEBSITE LEAD — Season & Team Details"],
      "\"TRAIN\"": ["TPF WEBSITE LEAD — Program & Class Details"],
      "\"SUPPORT\"": ["BIZ REVENUE LEAD — Revenue targets & reports", "CREATIVE LEAD — Brand Visuals", "BIZ/FACILITY DEVELOPMENT — Efficiency and Future"],
    }
  },
  Serena: {
    color: "#b45309", bg: "#fffbeb", border: "#fcd34d",
    sections: {
      "\"PLAY\"": ["FLY SUPPORT — Assist GM's", "UNIFORM SUPPORT — Assist Marco", "SPORTSYOU SUPPORT — Assist Max"],
      "\"TRAIN\"": ["BDAY PARTY LEAD — Plan & Manage", "COURT RENTALS — Plan & Manage", "AMBASSADOR SUPPORT — Assist Ov"],
      "\"SUPPORT\"": ["CUSTOMER EXPERIENCE LEAD — Plan & Execute", "RETAIL LEAD — Organize and manage apparel", "SCHOOL LIAISON — Plan & Execute"],
    }
  },
};

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

// ── CHANGE #4: Deadline helpers ───────────────────────────────────────────────
function isOverdue(due, status) {
  if (!due || status === "Done" || status === "Cancelled") return false;
  return new Date(due) < new Date(new Date().toDateString());
}
function isSoonDue(due, status) {
  if (!due || status === "Done" || status === "Cancelled") return false;
  const diff = (new Date(due) - new Date(new Date().toDateString())) / (1000*60*60*24);
  return diff >= 0 && diff <= 2;
}

// ── CHANGE #2: Print styles that include subtasks ─────────────────────────────
function injectPrintStyles() {
  if (document.getElementById("tpf-print-styles")) return;
  const style = document.createElement("style");
  style.id = "tpf-print-styles";
  style.textContent = `
    .no-print { }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
      * { box-shadow: none !important; }
      .subtask-list { display: block !important; }
      .task-expanded { display: block !important; }
      .print-expand { display: block !important; }
    }
  `;
  document.head.appendChild(style);
}

function Tag({ label, style }) {
  return <span style={{ ...style, fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"99px", letterSpacing:"0.04em", whiteSpace:"nowrap", textTransform:"uppercase" }}>{label}</span>;
}

// ── CHANGE #5: SubtaskList with due dates ─────────────────────────────────────
function SubtaskList({ subtasks, onChange }) {
  const [newText, setNewText] = useState("");
  const [newDue, setNewDue] = useState("");
  const toggle = (id) => onChange(subtasks.map(s => s.id===id ? {...s,done:!s.done} : s));
  const remove = (id) => onChange(subtasks.filter(s => s.id!==id));
  const add = () => {
    if (newText.trim()) {
      onChange([...subtasks, {id:genId(), text:newText.trim(), done:false, due: newDue||""}]);
      setNewText(""); setNewDue("");
    }
  };
  const pct = subtasks.length ? Math.round(subtasks.filter(s=>s.done).length/subtasks.length*100) : 0;
  return (
    <div style={{marginTop:"10px"}} className="subtask-list">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>Subtasks ({subtasks.filter(s=>s.done).length}/{subtasks.length})</span>
        {subtasks.length>0 && <span style={{fontSize:"11px",fontWeight:700,color:pct===100?"#166534":"#b45309"}}>{pct}%</span>}
      </div>
      {subtasks.length>0 && <div style={{height:"4px",background:"#e2e8f0",borderRadius:"99px",marginBottom:"8px",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:pct===100?"#22c55e":"#3b82f6",borderRadius:"99px",transition:"width 0.3s"}}/></div>}
      {subtasks.map(s => {
        const overdue = s.due && !s.done && new Date(s.due) < new Date(new Date().toDateString());
        return (
          <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:"6px",marginBottom:"5px",background:overdue?"#fff1f2":"transparent",borderRadius:"6px",padding:overdue?"3px 5px":"0"}}>
            <input type="checkbox" checked={s.done} onChange={()=>toggle(s.id)} style={{marginTop:"2px",cursor:"pointer",accentColor:"#0f766e"}}/>
            <div style={{flex:1}}>
              <span style={{fontSize:"12px",color:s.done?"#94a3b8":"#334155",textDecoration:s.done?"line-through":"none",lineHeight:1.4}}>{s.text}</span>
              {s.due && <span style={{marginLeft:"6px",fontSize:"10px",color:overdue?"#dc2626":"#64748b",fontWeight:overdue?700:400}}>{overdue?"⚠️ ":""}{s.due}</span>}
            </div>
            <button onClick={()=>remove(s.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#64748b",padding:"0 2px"}} className="no-print">x</button>
          </div>
        );
      })}
      <div style={{display:"flex",gap:"4px",marginTop:"6px",flexWrap:"wrap"}} className="no-print">
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add subtask..." style={{flex:1,minWidth:"120px",fontSize:"12px",border:"1px dashed #cbd5e1",borderRadius:"6px",padding:"4px 8px",outline:"none",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b"}}/>
        <input type="date" value={newDue} onChange={e=>setNewDue(e.target.value)} title="Subtask due date" style={{fontSize:"12px",border:"1px dashed #cbd5e1",borderRadius:"6px",padding:"4px 6px",fontFamily:"inherit",color:"#1e293b",background:"#f8fafc"}}/>
        <button onClick={add} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>+</button>
      </div>
    </div>
  );
}

// ── CHANGE #7: Change log display ─────────────────────────────────────────────
function ChangeLog({ log }) {
  if (!log || log.length === 0) return null;
  return (
    <div style={{marginTop:"8px",borderTop:"1px solid #f1f5f9",paddingTop:"8px"}}>
      <div style={{fontSize:"10px",fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"4px"}}>Change History</div>
      {[...log].reverse().slice(0,5).map((entry, i) => (
        <div key={i} style={{fontSize:"10px",color:"#94a3b8",marginBottom:"2px"}}>
          <span style={{color:"#64748b",fontWeight:600}}>{entry.by||"Unknown"}</span> · {formatDateTime(entry.at)} · <span style={{fontStyle:"italic"}}>{entry.change}</span>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, quadrant, onUpdate, onDelete, onMove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [expanded, setExpanded] = useState(false);
  const [showMove, setShowMove] = useState(false);

  const overdue = isOverdue(task.due, task.status);
  const soonDue = isSoonDue(task.due, task.status);

  const addChangeLog = (task, changeDesc, updatedBy) => {
    const log = task.change_log || [];
    return [...log, { at: new Date().toISOString(), by: updatedBy || task.updated_by || "", change: changeDesc }];
  };

  const save = () => {
    if (draft.trim() && draft.trim() !== task.text) {
      const log = addChangeLog(task, `Renamed to "${draft.trim()}"`, task.updated_by);
      onUpdate({...task, text:draft.trim(), updated_at:new Date().toISOString(), change_log: log});
    }
    setEditing(false);
  };

  const handleFieldUpdate = (field, value, label) => {
    const log = addChangeLog(task, `${label} → ${value}`, task.updated_by);
    onUpdate({...task, [field]:value, updated_at:new Date().toISOString(), change_log: log});
  };

  const ss = STATUS_STYLES[task.status]||STATUS_STYLES["Not Started"];
  const ps = PRIORITY_STYLES[task.priority]||PRIORITY_STYLES["MID"];
  const bs = BIZ_COLORS[task.biz]||BIZ_COLORS["FLY"];
  const subtaskPct = task.subtasks?.length ? Math.round(task.subtasks.filter(s=>s.done).length/task.subtasks.length*100) : null;

  // ── CHANGE #4: Overdue styling on card ───────────────────────────────────────
  const cardBorder = overdue ? "#dc2626" : soonDue ? "#f59e0b" : quadrant.border;
  const cardBg = overdue ? "#fff5f5" : "#ffffff";

  // ── CHANGE #3: Shared task co-assignees ───────────────────────────────────────
  const sharedWith = task.shared_with || [];

  return (
    <div style={{background:cardBg,color:"#1e293b",border:"1.5px solid "+cardBorder,borderRadius:"10px",padding:"10px 12px",marginBottom:"7px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",position:"relative"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 10px rgba(0,0,0,0.12)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.06)"}>

      {/* CHANGE #4: Overdue banner */}
      {overdue && <div style={{background:"#dc2626",color:"#fff",fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"4px",marginBottom:"6px",display:"inline-block"}}>⚠️ MISSED DEADLINE</div>}
      {soonDue && !overdue && <div style={{background:"#f59e0b",color:"#fff",fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"4px",marginBottom:"6px",display:"inline-block"}}>⏰ DUE SOON</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
          <Tag label={task.biz} style={{background:bs.bg,color:bs.color}}/>
          <Tag label={task.priority} style={{background:ps.bg,color:ps.color}}/>
          {task.subtasks?.length>0 && <Tag label={task.subtasks.filter(s=>s.done).length+"/"+task.subtasks.length+" steps"} style={{background:subtaskPct===100?"#dcfce7":"#f1f5f9",color:subtaskPct===100?"#166534":"#64748b"}}/>}
          {sharedWith.length>0 && <Tag label={"Shared"} style={{background:"#fdf4ff",color:"#7e22ce"}}/>}
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

      {/* CHANGE #2: Show subtasks in print view always */}
      {task.subtasks?.length>0 && !expanded && (
        <div className="print-expand" style={{display:"none"}}>
          <SubtaskList subtasks={task.subtasks||[]} onChange={()=>{}}/>
        </div>
      )}

      <div style={{display:"flex",gap:"5px",alignItems:"center",flexWrap:"wrap"}}>
        <Tag label={task.status} style={{background:ss.bg,color:ss.color}}/>
        {task.assignee && <span style={{fontSize:"11px",color:"#64748b",fontWeight:500}}>👤 {task.assignee}</span>}
        {/* CHANGE #3: Show co-assignees */}
        {sharedWith.map(m => <span key={m} style={{fontSize:"11px",color:"#7e22ce",fontWeight:500}}>👤 {m}</span>)}
        {task.due && <span style={{fontSize:"11px",color:overdue?"#dc2626":soonDue?"#d97706":"#64748b",fontWeight:overdue||soonDue?700:400}}>📅 {task.due}</span>}
        {task.updated_at && <span style={{fontSize:"10px",color:"#94a3b8",marginLeft:"auto"}}>✏️ {formatDateTime(task.updated_at)}{task.updated_by?" · "+task.updated_by:""}</span>}
      </div>

      {expanded && (
        <div style={{marginTop:"10px",paddingTop:"10px",borderTop:"1px solid "+quadrant.border}} className="task-expanded">
          <div style={{marginBottom:"10px",background:quadrant.light,borderRadius:"8px",padding:"8px 10px"}}>
            <label style={{fontSize:"10px",color:quadrant.color,fontWeight:800,textTransform:"uppercase",display:"block",marginBottom:"4px",letterSpacing:"0.08em"}}>📝 Notes / Updates</label>
            <textarea value={task.notes||""} onChange={e=>{const log=addChangeLog(task,"Updated notes",task.updated_by);onUpdate({...task,notes:e.target.value,updated_at:new Date().toISOString(),change_log:log});}} placeholder="Add notes, updates, links, or context here..." rows={3} style={{fontSize:"12px",border:"1px solid "+quadrant.border,borderRadius:"6px",padding:"5px 8px",fontFamily:"inherit",width:"100%",boxSizing:"border-box",resize:"vertical",background:"#fff",color:"#1e293b",lineHeight:1.5}}/>
          </div>

          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
            {[
              {label:"Status",value:task.status,opts:STATUS_OPTIONS,key:"status"},
              {label:"Priority",value:task.priority,opts:PRIORITY_OPTIONS,key:"priority"},
              {label:"Business",value:task.biz,opts:BUSINESSES,key:"biz"},
              {label:"Assignee",value:task.assignee||"",opts:["", ...TEAM_MEMBERS],key:"assignee"},
              {label:"Updated By",value:task.updated_by||"",opts:["", ...TEAM_MEMBERS],key:"updated_by"}
            ].map(f=>(
              <div key={f.key} style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                <label style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>{f.label}</label>
                <select value={f.value} onChange={e=>handleFieldUpdate(f.key, e.target.value, f.label)} style={{fontSize:"12px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"3px 6px",fontFamily:"inherit",color:"#1e293b",background:"#fff"}}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
              <label style={{fontSize:"10px",color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Due Date</label>
              <input type="date" value={task.due||""} onChange={e=>handleFieldUpdate("due", e.target.value, "Due date")} style={{fontSize:"12px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"3px 6px",fontFamily:"inherit",color:"#1e293b",background:"#fff"}}/>
            </div>
          </div>

          {/* CHANGE #3: Shared task co-assignees picker */}
          <div style={{marginBottom:"10px"}}>
            <label style={{fontSize:"10px",color:"#7e22ce",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:"4px"}}>👥 Shared With (co-assignees)</label>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {TEAM_MEMBERS.filter(m=>m!==task.assignee).map(m=>{
                const active = sharedWith.includes(m);
                return (
                  <button key={m} onClick={()=>{
                    const next = active ? sharedWith.filter(x=>x!==m) : [...sharedWith,m];
                    const log = addChangeLog(task, `Shared with ${m}`, task.updated_by);
                    onUpdate({...task, shared_with:next, updated_at:new Date().toISOString(), change_log:log});
                  }} style={{fontSize:"11px",fontWeight:600,padding:"3px 9px",borderRadius:"99px",border:"1.5px solid",borderColor:active?"#7e22ce":"#e2e8f0",background:active?"#fdf4ff":"#fff",color:active?"#7e22ce":"#64748b",cursor:"pointer"}}>
                    {m}
                  </button>
                );
              })}
            </div>
            {sharedWith.length>0 && <div style={{fontSize:"10px",color:"#7e22ce",marginTop:"4px"}}>This task appears on: {sharedWith.join(", ")}'s board</div>}
          </div>

          <SubtaskList subtasks={task.subtasks||[]} onChange={subs=>{const log=addChangeLog(task,"Updated subtasks",task.updated_by);onUpdate({...task,subtasks:subs,updated_at:new Date().toISOString(),change_log:log});}}/>

          {/* CHANGE #7: Change log */}
          <ChangeLog log={task.change_log}/>

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
  const submit = () => {
    if (text.trim()) {
      onAdd({text:text.trim(),assignee,biz,priority:defaultPriority,status:"Not Started",due:"",notes:"",subtasks:[],shared_with:[],change_log:[{at:new Date().toISOString(),by:assignee||"",change:"Task created"}],updated_at:new Date().toISOString(),updated_by:assignee||""});
      setText(""); setAssignee(""); setBiz("FLY"); setOpen(false);
    }
  };
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
            {/* CHANGE #1: Updated header layout */}
            <div style={{fontSize:"9px",fontWeight:800,letterSpacing:"0.14em",color:quadrant.color,textTransform:"uppercase",lineHeight:1.3,maxWidth:"200px"}}>{quadrant.action}</div>
            <div style={{fontSize:"17px",fontWeight:800,color:quadrant.color,letterSpacing:"-0.02em",lineHeight:1.1,marginTop:"2px"}}>{quadrant.label}</div>
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

// ── CHANGE #8: Roles & Responsibilities section ───────────────────────────────
function RolesSection() {
  const [expanded, setExpanded] = useState(false);
  const members = Object.keys(ROLES_DATA);
  return (
    <div style={{marginTop:"32px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:"16px",overflow:"hidden"}}>
      <button onClick={()=>setExpanded(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",background:"#0f172a",border:"none",cursor:"pointer",borderRadius:expanded?"16px 16px 0 0":"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"18px"}}>📋</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:"15px",fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>Roles & Responsibilities</div>
            <div style={{fontSize:"11px",color:"#94a3b8",marginTop:"1px"}}>TPF / FLY Team — 2026</div>
          </div>
        </div>
        <span style={{color:"#94a3b8",fontSize:"16px"}}>{expanded?"▲":"▼"}</span>
      </button>
      {expanded && (
        <div style={{padding:"20px",overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"14px"}}>
            {members.map(member => {
              const r = ROLES_DATA[member];
              return (
                <div key={member} style={{border:"1.5px solid "+r.border,borderRadius:"12px",overflow:"hidden"}}>
                  <div style={{background:r.color,color:"#fff",padding:"10px 14px",fontWeight:800,fontSize:"14px",letterSpacing:"0.02em"}}>{member.toUpperCase()}</div>
                  <div style={{padding:"10px 14px",background:r.bg}}>
                    {Object.entries(r.sections).map(([section, roles]) => (
                      <div key={section} style={{marginBottom:"10px"}}>
                        <div style={{fontSize:"9px",fontWeight:800,color:r.color,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:"5px"}}>{section}</div>
                        {roles.map((role, i) => {
                          const [title, desc] = role.split(" — ");
                          return (
                            <div key={i} style={{marginBottom:"5px",paddingLeft:"8px",borderLeft:"2px solid "+r.border}}>
                              <div style={{fontSize:"11px",fontWeight:700,color:r.color}}>{title}</div>
                              {desc && <div style={{fontSize:"10px",color:"#64748b",marginTop:"1px"}}>{desc}</div>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  // ── CHANGE #4: Missed deadline filter ───────────────────────────────────────
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  // ── CHANGE #6: Undo stack ────────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => {
    injectPrintStyles();
    const load = async () => {
      try {
        const data = await sb.from("tasks").select("*");
        if (data?.error) { setError("Could not connect. Check your Supabase keys."); setLoading(false); return; }
        const board = { do:[], schedule:[], delegate:[], eliminate:[] };
        (data||[]).filter(t=>!t.archived).forEach(t => {
          if (board[t.quadrant]) board[t.quadrant].push({...t, subtasks: t.subtasks||[], shared_with: t.shared_with||[], change_log: t.change_log||[]});
        });
        setTasks(board);
      } catch(e) { setError("Connection failed. Check your Supabase URL and key."); }
      setLoading(false);
    };
    load();
  }, []);

  // ── CHANGE #6: Push to undo stack before mutations ───────────────────────────
  const pushUndo = useCallback((snapshot) => {
    setUndoStack(prev => [...prev.slice(-19), snapshot]);
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setTasks(prev);
    // Sync all tasks back to DB (best-effort)
    Object.entries(prev).forEach(([qId, qtasks]) => {
      qtasks.forEach(t => { sb.from("tasks").update({...t, quadrant:qId}, "id", t.id).catch(()=>{}); });
    });
  };

  const addTask = async (qId, data) => {
    pushUndo(JSON.parse(JSON.stringify(tasks)));
    const newTask = { ...data, quadrant: qId, week_label: currentWeek, archived: false };
    const tempId = genId();
    const optimisticTask = { ...newTask, id: tempId, subtasks: newTask.subtasks || [], shared_with: newTask.shared_with||[], change_log: newTask.change_log||[] };
    setTasks(prev => ({...prev, [qId]: [...prev[qId], optimisticTask]}));
    setSaving(true);
    try {
      const result = await sb.from("tasks").insert(newTask);
      const saved = Array.isArray(result) ? result[0] : result;
      if (saved && saved.id) {
        setTasks(prev => ({...prev, [qId]: prev[qId].map(t => t.id===tempId ? {...newTask, ...saved, text: saved.text || newTask.text, subtasks: saved.subtasks || newTask.subtasks || [], shared_with: saved.shared_with||[], change_log: saved.change_log||[]} : t)}));
      }
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const updateTask = async (qId, updated) => {
    pushUndo(JSON.parse(JSON.stringify(tasks)));
    setTasks(prev => ({...prev, [qId]: prev[qId].map(t=>t.id===updated.id?updated:t)}));

    // ── CHANGE #3: If task is shared, also update it for co-assignees visually
    // The shared_with array is stored on the task itself — the filtered view handles display
    try { await sb.from("tasks").update(updated, "id", updated.id); } catch(e) { console.error(e); }
  };

  const deleteTask = async (qId, id) => {
    pushUndo(JSON.parse(JSON.stringify(tasks)));
    setTasks(prev => ({...prev, [qId]: prev[qId].filter(t=>t.id!==id)}));
    try { await sb.from("tasks").delete("id", id); } catch(e) { console.error(e); }
  };

  const moveTask = async (fromId, taskId, toId) => {
    pushUndo(JSON.parse(JSON.stringify(tasks)));
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

  // ── CHANGE #3 & #4: Filtering — includes shared tasks and overdue ───────────
  const filtered = (qId) => tasks[qId].filter(t => {
    if (showOverdueOnly && !isOverdue(t.due, t.status)) return false;
    if (memberFilter!=="All") {
      const isAssigned = t.assignee === memberFilter;
      const isShared = (t.shared_with||[]).includes(memberFilter);
      if (!isAssigned && !isShared) return false;
    }
    if (bizFilter!=="All" && t.biz!==bizFilter) return false;
    if (statusFilter!=="All" && t.status!==statusFilter) return false;
    if (search && !t.text?.toLowerCase().includes(search.toLowerCase()) && !t.assignee?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const allTasks = Object.values(tasks).flat();
  const overdueCount = allTasks.filter(t=>isOverdue(t.due, t.status)).length;

  const FilterBtn = ({value, current, onClick, label, accent}) => <button onClick={onClick} style={{border:"1.5px solid "+(accent||"#e2e8f0"),borderRadius:"7px",padding:"4px 10px",fontSize:"12px",cursor:"pointer",fontWeight:600,background:current===value?(accent||"#0f172a"):"#fff",color:current===value?"#fff":(accent||"#475569"),transition:"all 0.15s",whiteSpace:"nowrap"}}>{label||value}</button>;

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
              {/* CHANGE #4: Overdue counter badge */}
              {overdueCount>0 && (
                <div onClick={()=>setShowOverdueOnly(v=>!v)} style={{background:showOverdueOnly?"#dc2626":"#fff1f2",borderRadius:"10px",padding:"6px 12px",textAlign:"center",cursor:"pointer",border:"1.5px solid #fca5a5"}}>
                  <div style={{fontSize:"18px",fontWeight:800,color:"#dc2626",lineHeight:1}}>{overdueCount}</div>
                  <div style={{fontSize:"10px",color:"#dc2626",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:"1px"}}>{showOverdueOnly?"Showing":"Overdue"}</div>
                </div>
              )}
              <div className="no-print" style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                <button onClick={()=>setShowHistory(true)} style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>📊 View History</button>
                <div style={{display:"flex",gap:"4px"}}>
                  <button onClick={()=>setShowReset(true)} style={{flex:1,background:"#0f172a",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",fontWeight:700}}>🔄 New Week</button>
                  {/* CHANGE #6: Undo button */}
                  <button onClick={handleUndo} disabled={undoStack.length===0} title="Undo last action" style={{background:undoStack.length>0?"#475569":"#e2e8f0",color:undoStack.length>0?"#fff":"#94a3b8",border:"none",borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:undoStack.length>0?"pointer":"not-allowed",fontWeight:700}} >↩️</button>
                  <button onClick={()=>window.print()} style={{background:"#475569",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",fontWeight:700}} title="Print">🖨️</button>
                </div>
              </div>
            </div>
          </div>

          {/* CHANGE #4: Overdue filter notice */}
          {showOverdueOnly && (
            <div style={{background:"#fff1f2",border:"1.5px solid #fca5a5",borderRadius:"10px",padding:"10px 14px",marginTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"13px",fontWeight:700,color:"#dc2626"}}>⚠️ Showing overdue tasks only ({overdueCount} tasks missed their deadline)</span>
              <button onClick={()=>setShowOverdueOnly(false)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontWeight:700,fontSize:"12px"}}>Clear filter ×</button>
            </div>
          )}

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
          {[{icon:"✏️",text:"Click text to rename"},{icon:"▼",text:"Expand for notes & details"},{icon:"📝",text:"Notes field when expanded"},{icon:"👥",text:"Shared tasks show on both boards"},{icon:"⚠️",text:"Red = missed deadline, click Overdue badge to filter"},{icon:"↩️",text:"Undo button reverses last action"},{icon:"🔄",text:"Not Started + In Progress auto-carry"},{icon:"🖨️",text:"Print includes subtasks"}].map(t=>(<span key={t.text} style={{fontSize:"12px",color:"#64748b"}}>{t.icon} {t.text}</span>))}
        </div>

        {/* CHANGE #8: Roles & Responsibilities */}
        <RolesSection/>
      </div>
    </div>
  );
}
