import { useState, useEffect, useMemo } from "react";

// ─── Persistent Storage Helpers ───────────────────────────────────────────────
const useStorage = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  const [loaded, setLoaded] = useState(true);

  const set = (v) => {
    const next = typeof v === "function" ? v(value) : v;
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };

  return [value, set, loaded];
};

// ─── Currency / Formatting ─────────────────────────────────────────────────────
const CURRENCIES = ["SGD", "TWD", "CNY", "USD", "HKD", "Other"];
const CURRENCY_SYMBOLS = { TWD: "NT$", CNY: "¥", SGD: "S$", USD: "$", HKD: "HK$", Other: "" };

const fmt = (n, currency = "SGD") =>
  `${CURRENCY_SYMBOLS[currency] || ""}${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const today = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
};

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const monthKey = (y, m) => `${y}-${pad(m)}`;

// ─── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    revenue: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>,
    purchase: <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H15c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0019.44 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>,
    staff: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
    expense: <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>,
    report: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>,
    add: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
    delete: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>,
    trend_up: <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>,
    trend_down: <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>,
    warning: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
    calendar: <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>,
    chevron_left: <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>,
    chevron_right: <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>,
    sparkle: <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>,
    info: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{flexShrink:0}}>
      {icons[name]}
    </svg>
  );
};

// ─── Pill / Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    good: { label: "優良 ✦", bg: "#d4f5e2", color: "#1a7a4a" },
    ok: { label: "尚可 ◈", bg: "#fff3cc", color: "#a06800" },
    poor: { label: "欠佳 ▲", bg: "#ffe0e0", color: "#c0392b" },
  };
  const s = map[status] || map.ok;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 20,
      padding: "3px 12px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
    }}>{s.label}</span>
  );
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{
    position:"fixed",inset:0,background:"rgba(10,6,25,0.72)",zIndex:1000,
    display:"flex",alignItems:"center",justifyContent:"center",padding:16,
  }} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{
      background:"#1a1030",border:"1px solid rgba(255,200,120,0.2)",
      borderRadius:20,padding:28,width:"100%",maxWidth:480,
      maxHeight:"90vh",overflowY:"auto",
      boxShadow:"0 24px 80px rgba(0,0,0,0.6)",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{color:"#f5d98e",margin:0,fontSize:18,fontFamily:"'Playfair Display',serif"}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#a08070",padding:4}}>
          <Icon name="close" size={20}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Input / Select helpers ────────────────────────────────────────────────────
const inputStyle = {
  width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,200,120,0.2)",
  borderRadius:10,padding:"10px 14px",color:"#f0e8d8",fontSize:14,
  outline:"none",boxSizing:"border-box",fontFamily:"inherit",
};
const labelStyle = { fontSize:12,color:"#b09080",marginBottom:4,display:"block",letterSpacing:.5 };

const Field = ({ label, children }) => (
  <div style={{marginBottom:14}}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const Btn = ({ onClick, children, variant="primary", small=false, style:s={} }) => {
  const variants = {
    primary: { background:"linear-gradient(135deg,#c9a84c,#f5d98e)", color:"#2a1a05" },
    ghost:   { background:"rgba(255,200,120,0.08)", color:"#f5d98e", border:"1px solid rgba(255,200,120,0.25)" },
    danger:  { background:"rgba(220,60,60,0.15)", color:"#ff8a8a", border:"1px solid rgba(220,60,60,0.3)" },
  };
  return (
    <button onClick={onClick} style={{
      ...variants[variant],border:"none",borderRadius:10,
      padding: small ? "6px 14px" : "10px 22px",
      fontSize: small ? 12 : 14, fontWeight:700, cursor:"pointer",
      letterSpacing:.5, ...s
    }}>{children}</button>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, accent="#f5d98e", trend }) => (
  <div style={{
    background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,200,120,0.12)",
    borderRadius:16,padding:"18px 20px",flex:1,minWidth:140,
  }}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span style={{fontSize:11,color:"#a09080",textTransform:"uppercase",letterSpacing:1}}>{label}</span>
      <Icon name={icon} size={16} color={accent}/>
    </div>
    <div style={{fontSize:24,fontWeight:700,color:accent,marginTop:8,fontFamily:"'Playfair Display',serif"}}>{value}</div>
    {sub && <div style={{fontSize:11,color:"#907060",marginTop:4}}>{sub}</div>}
    {trend != null && (
      <div style={{fontSize:11,marginTop:6,color:trend>=0?"#4ee89a":"#ff7070",display:"flex",alignItems:"center",gap:4}}>
        <Icon name={trend>=0?"trend_up":"trend_down"} size={12} color={trend>=0?"#4ee89a":"#ff7070"}/>
        {Math.abs(trend).toFixed(1)}% vs 上月
      </div>
    )}
  </div>
);

// ─── Mini Bar ──────────────────────────────────────────────────────────────────
const MiniBar = ({ value, max, color="#f5d98e" }) => (
  <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden",flex:1}}>
    <div style={{height:"100%",width:`${Math.min(100,(value/Math.max(max,1))*100)}%`,background:color,borderRadius:2,transition:"width .4s"}}/>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { y: TY, m: TM, d: TD } = today();

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("dashboard");

  // ── Data Stores ─────────────────────────────────────────────────────────────
  const [sales,     setSales,     salesLoaded]    = useStorage("lumiere_sales_v2", []);
  const [purchases, setPurchases, purchasesLoaded]= useStorage("lumiere_purchases_v2", []);
  const [staff,     setStaff,     staffLoaded]    = useStorage("lumiere_staff_v2", []);
  const [expenses,  setExpenses,  expensesLoaded] = useStorage("lumiere_expenses_v2", []);
  // expenses: { id, year, month, category, label, amount, currency }

  // ── Selected period ──────────────────────────────────────────────────────────
  const [selYear,  setSelYear]  = useState(TY);
  const [selMonth, setSelMonth] = useState(TM);

  const loaded = salesLoaded && purchasesLoaded && staffLoaded && expensesLoaded;

  // ── IDs ──────────────────────────────────────────────────────────────────────
  const uid = () => Math.random().toString(36).slice(2,9).toUpperCase();

  // ═══════════════ COMPUTED ═══════════════════════════════════════════════════
  const monthlySales = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      const k = monthKey(s.year, s.month);
      if (!map[k]) map[k] = { total:0, days:new Set(), count:0 };
      map[k].total += Number(s.amount);
      map[k].days.add(dateKey(s.year,s.month,s.day));
      map[k].count++;
    });
    return map;
  }, [sales]);

  const monthlyPurchases = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      const k = monthKey(p.year, p.month);
      if (!map[k]) map[k] = 0;
      map[k] += Number(p.amountSGD || p.amount);
    });
    return map;
  }, [purchases]);

  const monthlyStaffCost = useMemo(() => {
    const map = {};
    staff.forEach(s => {
      (s.records || []).forEach(r => {
        const k = monthKey(r.year, r.month);
        if (!map[k]) map[k] = 0;
        map[k] += Number(s.hourlyRate) * Number(r.hours);
      });
    });
    return map;
  }, [staff]);

  const monthlyExpenses = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const k = monthKey(e.year, e.month);
      if (!map[k]) map[k] = 0;
      map[k] += Number(e.amountSGD || e.amount);
    });
    return map;
  }, [expenses]);

  const getMonthSummary = (y, m) => {
    const k = monthKey(y, m);
    const rev  = (monthlySales[k]?.total) || 0;
    const days = monthlySales[k]?.days?.size || 0;
    const purchase = monthlyPurchases[k] || 0;
    const staffCost = monthlyStaffCost[k] || 0;
    const otherExp = monthlyExpenses[k] || 0;
    const totalExp = purchase + staffCost + otherExp;
    const profit = rev - totalExp;
    const avgDaily = days > 0 ? rev / days : 0;
    const purchaseRatio = rev > 0 ? purchase / rev * 100 : 0;
    const staffRatio = rev > 0 ? staffCost / rev * 100 : 0;

    let purchaseStatus = purchaseRatio < 30 ? "good" : purchaseRatio < 45 ? "ok" : "poor";
    let staffStatus    = staffRatio    < 35 ? "good" : staffRatio    < 50 ? "ok" : "poor";
    let profitStatus   = profit > 0 ? (profit/rev > 0.2 ? "good" : "ok") : "poor";

    return { rev, days, purchase, staffCost, otherExp, totalExp, profit, avgDaily, purchaseRatio, staffRatio, purchaseStatus, staffStatus, profitStatus };
  };

  const curSummary = getMonthSummary(selYear, selMonth);
  const prevM = selMonth === 1 ? 12 : selMonth - 1;
  const prevY = selMonth === 1 ? selYear - 1 : selYear;
  const prevSummary = getMonthSummary(prevY, prevM);
  const revGrowth = prevSummary.rev > 0 ? (curSummary.rev - prevSummary.rev) / prevSummary.rev * 100 : null;

  // ── Year revenue ─────────────────────────────────────────────────────────────
  const yearRevenue = (y) => {
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const k = monthKey(y, m);
      total += monthlySales[k]?.total || 0;
    }
    return total;
  };

  // ═══════════════ NAVIGATION ══════════════════════════════════════════════════
  const NAV = [
    { id:"dashboard", label:"總覽", icon:"dashboard" },
    { id:"sales",     label:"營業額", icon:"revenue" },
    { id:"purchases", label:"進貨", icon:"purchase" },
    { id:"staff",     label:"人事", icon:"staff" },
    { id:"expenses",  label:"支出", icon:"expense" },
    { id:"reports",   label:"報告", icon:"report" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh", background:"#0d0820",
      color:"#f0e8d8", fontFamily:"'Lato','Helvetica Neue',sans-serif",
      display:"flex", flexDirection:"column",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,120,0.2); border-radius:2px; }
        input,select,textarea { color:#f0e8d8 !important; }
        input::placeholder { color:#705050 !important; }
        option { background:#1a1030; }
        select option { background:#1a1030; color:#f0e8d8; }
      `}</style>

      {/* Header */}
      <header style={{
        padding:"16px 20px 12px",
        background:"linear-gradient(135deg,#1a0e38 0%,#0d0820 100%)",
        borderBottom:"1px solid rgba(255,200,120,0.12)",
        display:"flex",alignItems:"center",gap:12,
      }}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#c9a84c,#f5d98e)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="sparkle" size={18} color="#2a1a05"/>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#f5d98e",letterSpacing:.5}}>
            Lumière Beauty Bar
          </div>
          <div style={{fontSize:10,color:"#a08060",letterSpacing:2,textTransform:"uppercase"}}>管理系統</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:12,color:"#806050"}}>
          {TY}/{pad(TM)}/{pad(TD)}
        </div>
      </header>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
        {!loaded ? (
          <div style={{textAlign:"center",paddingTop:80,color:"#a08060"}}>載入中…</div>
        ) : (
          <>
            {tab === "dashboard"  && <Dashboard   {...{selYear,setSelYear,selMonth,setSelMonth,curSummary,prevSummary,revGrowth,sales,monthlySales,yearRevenue,getMonthSummary,TY,TM}}/>}
            {tab === "sales"      && <SalesTab     {...{sales,setSales,selYear,setSelYear,selMonth,setSelMonth,uid,monthlySales,TY,TM,TD}}/>}
            {tab === "purchases"  && <PurchasesTab {...{purchases,setPurchases,selYear,setSelYear,selMonth,setSelMonth,uid,TY,TM,TD}}/>}
            {tab === "staff"      && <StaffTab     {...{staff,setStaff,selYear,setSelYear,selMonth,setSelMonth,uid,monthlyStaffCost,TY,TM}}/>}
            {tab === "expenses"   && <ExpensesTab  {...{expenses,setExpenses,selYear,setSelYear,selMonth,setSelMonth,uid,TY,TM,curSummary,getMonthSummary}}/>}
            {tab === "reports"    && <ReportsTab   {...{selYear,setSelYear,selMonth,setSelMonth,getMonthSummary,yearRevenue,monthlySales,monthlyPurchases,monthlyStaffCost,monthlyExpenses,TY,TM}}/>}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"rgba(13,8,32,0.97)",
        borderTop:"1px solid rgba(255,200,120,0.12)",
        display:"flex",
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            flex:1,padding:"10px 0 8px",background:"none",border:"none",
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            color: tab===n.id ? "#f5d98e" : "#604040",
            borderTop: tab===n.id ? "2px solid #f5d98e" : "2px solid transparent",
            transition:"all .2s",
          }}>
            <Icon name={n.icon} size={18} color={tab===n.id?"#f5d98e":"#604040"}/>
            <span style={{fontSize:9,letterSpacing:.5,fontWeight:700}}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({ selYear,setSelYear,selMonth,setSelMonth,curSummary,prevSummary,revGrowth,sales,monthlySales,yearRevenue,getMonthSummary,TY,TM }) {
  const years = Array.from({length:6},(_,i)=>TY-i);
  const yrRev = yearRevenue(selYear);
  const prevYrRev = yearRevenue(selYear-1);
  const yrGrowth = prevYrRev > 0 ? (yrRev - prevYrRev)/prevYrRev*100 : null;

  // Last 5 sales
  const recent = [...sales].sort((a,b) => b.id.localeCompare(a.id)).slice(0,5);

  return (
    <div>
      {/* Period Selector */}
      <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center"}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,width:90}}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,flex:1}}>
          {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>

      {/* Monthly KPIs */}
      <SectionTitle icon="dashboard" label={`${selYear}年 ${MONTHS[selMonth-1]} 總覽`}/>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <StatCard label="當月營業額" value={fmt(curSummary.rev)} icon="revenue" trend={revGrowth}/>
        <StatCard label="當月淨利" value={fmt(curSummary.profit)} icon="sparkle" accent={curSummary.profit>=0?"#4ee89a":"#ff7070"}/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard label="工作天數" value={`${curSummary.days} 天`} icon="calendar" accent="#b0d4ff"/>
        <StatCard label="平均日營業額" value={fmt(curSummary.avgDaily)} icon="trend_up" accent="#e0b0ff"/>
      </div>

      {/* Health Indicators */}
      <SectionTitle icon="info" label="本月健康指標"/>
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,padding:16,marginBottom:20,border:"1px solid rgba(255,200,120,0.1)"}}>
        <HealthRow label="進貨佔比" ratio={curSummary.purchaseRatio} status={curSummary.purchaseStatus} threshold={[30,45]}/>
        <HealthRow label="人事佔比" ratio={curSummary.staffRatio}    status={curSummary.staffStatus}    threshold={[35,50]}/>
        <HealthRow label="整體獲利" ratio={curSummary.rev>0?curSummary.profit/curSummary.rev*100:0} status={curSummary.profitStatus} threshold={[20,5]} isProfit/>
      </div>

      {/* Year Overview */}
      <SectionTitle icon="report" label={`${selYear} 年度概況`}/>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <StatCard label="年度總營業額" value={fmt(yrRev)} icon="revenue" accent="#f5d98e"
          trend={yrGrowth}/>
        <StatCard label="12月月均" value={fmt(yrRev/12)} icon="calendar" accent="#b0d4ff"/>
      </div>

      {/* Monthly bar chart */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,padding:16,marginBottom:20,border:"1px solid rgba(255,200,120,0.1)"}}>
        <div style={{fontSize:11,color:"#a09080",marginBottom:12,letterSpacing:1}}>各月營業額</div>
        {(() => {
          const vals = Array.from({length:12},(_,i)=>monthlySales[monthKey(selYear,i+1)]?.total||0);
          const mx = Math.max(...vals,1);
          return (
            <div style={{display:"flex",gap:4,alignItems:"flex-end",height:80}}>
              {vals.map((v,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{
                    width:"100%",background: i+1===selMonth?"#f5d98e":"rgba(255,200,120,0.3)",
                    borderRadius:"3px 3px 0 0",
                    height: `${Math.max(4,(v/mx)*65)}px`,transition:"height .3s",
                  }}/>
                  <span style={{fontSize:8,color:"#706050"}}>{MONTH_LABELS[i]}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Recent Sales */}
      <SectionTitle icon="revenue" label="最近營業紀錄"/>
      {recent.length === 0 ? <EmptyState text="尚無營業紀錄"/> : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {recent.map(s=>(
            <div key={s.id} style={{
              background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",
              display:"flex",justifyContent:"space-between",alignItems:"center",
              border:"1px solid rgba(255,200,120,0.08)",
            }}>
              <div>
                <div style={{fontSize:13,color:"#f0e8d8",fontWeight:700}}>#{s.orderNo}</div>
                <div style={{fontSize:11,color:"#806050",marginTop:2}}>{s.year}/{pad(s.month)}/{pad(s.day)}</div>
              </div>
              <div style={{fontSize:16,fontWeight:700,color:"#f5d98e"}}>{fmt(s.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HealthRow = ({ label, ratio, status, threshold, isProfit }) => (
  <div style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <span style={{fontSize:12,color:"#b09080"}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:13,fontWeight:700,color:"#f0e8d8"}}>{ratio.toFixed(1)}%</span>
        <StatusBadge status={status}/>
      </div>
    </div>
    <MiniBar value={ratio} max={100} color={status==="good"?"#4ee89a":status==="ok"?"#f5d98e":"#ff7070"}/>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SALES TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SalesTab({ sales,setSales,selYear,setSelYear,selMonth,setSelMonth,uid,monthlySales,TY,TM,TD }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ year:TY,month:TM,day:TD,orderNo:"",amount:"",note:"" });
  const years = Array.from({length:6},(_,i)=>TY-i);

  const filtered = sales.filter(s=>s.year===selYear&&s.month===selMonth)
    .sort((a,b)=>b.day-a.day);
  const k = monthKey(selYear,selMonth);
  const monthTotal = monthlySales[k]?.total||0;
  const workDays = monthlySales[k]?.days?.size||0;

  const save = () => {
    if (!form.orderNo || !form.amount) return;
    const entry = { ...form, id:uid(), year:Number(form.year),month:Number(form.month),day:Number(form.day),amount:Number(form.amount) };
    setSales(p=>[...p,entry]);
    setModal(false);
    setForm({year:TY,month:TM,day:TD,orderNo:"",amount:"",note:""});
  };

  const del = (id) => setSales(p=>p.filter(s=>s.id!==id));

  return (
    <div>
      <TabHeader title="每日營業額紀錄" onAdd={()=>setModal(true)}/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <select value={selYear}  onChange={e=>setSelYear(Number(e.target.value))}  style={{...inputStyle,width:90}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,flex:1}}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <StatCard label="月總營業額 (SGD)" value={fmt(monthTotal)} icon="revenue"/>
        <StatCard label="工作天數" value={`${workDays}天`} icon="calendar" accent="#b0d4ff"/>
      </div>

      {filtered.length===0 ? <EmptyState text="本月尚無記錄"/> : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(s=>(
            <div key={s.id} style={{
              background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",
              display:"flex",justifyContent:"space-between",alignItems:"center",
              border:"1px solid rgba(255,200,120,0.08)",
            }}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#f0e8d8"}}>#{s.orderNo}</div>
                <div style={{fontSize:11,color:"#806050"}}>{s.year}/{pad(s.month)}/{pad(s.day)}{s.note?` · ${s.note}`:""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:16,fontWeight:700,color:"#f5d98e"}}>{fmt(s.amount)}</span>
                <button onClick={()=>del(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#805050",padding:4}}>
                  <Icon name="delete" size={16} color="#ff7070"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="新增營業紀錄" onClose={()=>setModal(false)}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:1}}>
              <label style={labelStyle}>年份</label>
              <select value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} style={inputStyle}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
            </div>
            <div style={{flex:1}}>
              <label style={labelStyle}>月份</label>
              <select value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} style={inputStyle}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
            </div>
            <div style={{flex:1}}>
              <label style={labelStyle}>日</label>
              <input type="number" value={form.day} min={1} max={31} onChange={e=>setForm(f=>({...f,day:e.target.value}))} style={inputStyle}/>
            </div>
          </div>
          <Field label="單號">
            <input value={form.orderNo} onChange={e=>setForm(f=>({...f,orderNo:e.target.value}))} placeholder="e.g. INV-001" style={inputStyle}/>
          </Field>
          <Field label="金額 (SGD)">
            <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle}/>
          </Field>
          <Field label="備註 (選填)">
            <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="備註說明" style={inputStyle}/>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn onClick={save}>儲存</Btn>
            <Btn variant="ghost" onClick={()=>setModal(false)}>取消</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASES TAB
// ═══════════════════════════════════════════════════════════════════════════════
const EXCHANGE = { SGD:1, TWD:1/10.5, CNY:1/5.2, USD:1.35, HKD:1/10.5, Other:1 };

function PurchasesTab({ purchases,setPurchases,selYear,setSelYear,selMonth,setSelMonth,uid,TY,TM,TD }) {
  const [modal,setModal] = useState(false);
  const [form,setForm] = useState({ year:TY,month:TM,day:TD,item:"",amount:"",currency:"SGD",note:"" });
  const years = Array.from({length:6},(_,i)=>TY-i);

  const filtered = purchases.filter(p=>p.year===selYear&&p.month===selMonth).sort((a,b)=>b.day-a.day);
  const monthTotal = filtered.reduce((s,p)=>s+Number(p.amountSGD||p.amount),0);

  const save = () => {
    if (!form.item||!form.amount) return;
    const rate = EXCHANGE[form.currency]||1;
    const amountSGD = Number(form.amount)*rate;
    setPurchases(p=>[...p,{...form,id:uid(),year:Number(form.year),month:Number(form.month),day:Number(form.day),amount:Number(form.amount),amountSGD}]);
    setModal(false);
    setForm({year:TY,month:TM,day:TD,item:"",amount:"",currency:"SGD",note:""});
  };

  return (
    <div>
      <TabHeader title="每日進貨紀錄" onAdd={()=>setModal(true)}/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,width:90}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,flex:1}}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <StatCard label="月進貨總額(SGD)" value={fmt(monthTotal)} icon="purchase" accent="#e0b0ff"/>
        <StatCard label="筆數" value={`${filtered.length} 筆`} icon="calendar" accent="#b0d4ff"/>
      </div>

      {filtered.length===0 ? <EmptyState text="本月尚無進貨記錄"/> : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(p=>(
            <div key={p.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,200,120,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#f0e8d8"}}>{p.item}</div>
                  <div style={{fontSize:11,color:"#806050",marginTop:2}}>{p.year}/{pad(p.month)}/{pad(p.day)}{p.note?` · ${p.note}`:""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#e0b0ff"}}>{CURRENCY_SYMBOLS[p.currency]||""}{Number(p.amount).toLocaleString()} {p.currency}</div>
                  {p.currency!=="SGD"&&<div style={{fontSize:11,color:"#a09080"}}>≈ S${Number(p.amountSGD||p.amount).toLocaleString()}</div>}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                <button onClick={()=>setPurchases(prev=>prev.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                  <Icon name="delete" size={16} color="#ff7070"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="新增進貨紀錄" onClose={()=>setModal(false)}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:1}}><label style={labelStyle}>年</label><select value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} style={inputStyle}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div style={{flex:1}}><label style={labelStyle}>月</label><select value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} style={inputStyle}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select></div>
            <div style={{flex:1}}><label style={labelStyle}>日</label><input type="number" value={form.day} min={1} max={31} onChange={e=>setForm(f=>({...f,day:e.target.value}))} style={inputStyle}/></div>
          </div>
          <Field label="進貨項目">
            <input value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} placeholder="項目名稱" style={inputStyle}/>
          </Field>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:2}}><label style={labelStyle}>金額</label><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle}/></div>
            <div style={{flex:1}}><label style={labelStyle}>貨幣</label>
              <select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} style={inputStyle}>
                {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {form.currency!=="SGD"&&<div style={{fontSize:12,color:"#b09080",marginBottom:12,padding:"8px 12px",background:"rgba(255,200,120,0.06)",borderRadius:8}}>
            ≈ S${form.amount?(Number(form.amount)*(EXCHANGE[form.currency]||1)).toLocaleString():0} (匯率僅供參考)
          </div>}
          <Field label="備註">
            <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="供應商/備註" style={inputStyle}/>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn onClick={save}>儲存</Btn>
            <Btn variant="ghost" onClick={()=>setModal(false)}>取消</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StaffTab({ staff,setStaff,selYear,setSelYear,selMonth,setSelMonth,uid,monthlyStaffCost,TY,TM }) {
  const [addStaffModal,setAddStaffModal] = useState(false);
  const [addRecordModal,setAddRecordModal] = useState(null); // staffId
  const [staffForm,setStaffForm] = useState({name:"",hourlyRate:""});
  const [recordForm,setRecordForm] = useState({year:TY,month:TM,hours:""});
  const years = Array.from({length:6},(_,i)=>TY-i);

  const k = monthKey(selYear,selMonth);
  const totalCost = monthlyStaffCost[k]||0;

  const saveStaff = () => {
    if(!staffForm.name||!staffForm.hourlyRate) return;
    setStaff(p=>[...p,{...staffForm,id:uid(),hourlyRate:Number(staffForm.hourlyRate),records:[]}]);
    setAddStaffModal(false);
    setStaffForm({name:"",hourlyRate:""});
  };

  const delStaff = (id) => setStaff(p=>p.filter(s=>s.id!==id));

  const saveRecord = (sid) => {
    if(!recordForm.hours) return;
    setStaff(p=>p.map(s=>s.id===sid?{...s,records:[...s.records,{...recordForm,id:uid(),year:Number(recordForm.year),month:Number(recordForm.month),hours:Number(recordForm.hours)}]}:s));
    setAddRecordModal(null);
    setRecordForm({year:TY,month:TM,hours:""});
  };

  const delRecord = (sid,rid) => setStaff(p=>p.map(s=>s.id===sid?{...s,records:s.records.filter(r=>r.id!==rid)}:s));

  return (
    <div>
      <TabHeader title="人事管理" onAdd={()=>setAddStaffModal(true)}/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,width:90}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,flex:1}}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        <StatCard label="本月人事總支出 (SGD)" value={fmt(totalCost)} icon="staff" accent="#ff9eb5"/>
        <StatCard label="員工人數" value={`${staff.length} 人`} icon="staff" accent="#b0d4ff"/>
      </div>

      {staff.length===0 ? <EmptyState text="尚未新增員工"/> : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {staff.map(s=>{
            const monthRecs = s.records.filter(r=>r.year===selYear&&r.month===selMonth);
            const totalHours = monthRecs.reduce((a,r)=>a+r.hours,0);
            const salary = totalHours * s.hourlyRate;
            return (
              <div key={s.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,border:"1px solid rgba(255,200,120,0.1)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"#f0e8d8"}}>{s.name}</div>
                    <div style={{fontSize:11,color:"#a09080",marginTop:2}}>時薪 S${s.hourlyRate.toLocaleString()}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#ff9eb5"}}>{fmt(salary)}</div>
                    <div style={{fontSize:11,color:"#a09080"}}>{totalHours} 小時</div>
                  </div>
                </div>

                {monthRecs.length > 0 && (
                  <div style={{marginBottom:10,display:"flex",flexDirection:"column",gap:4}}>
                    {monthRecs.map(r=>(
                      <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#b09080",padding:"4px 8px",background:"rgba(255,255,255,0.03)",borderRadius:6}}>
                        <span>{r.year}/{pad(r.month)} · {r.hours}h · {fmt(r.hours*s.hourlyRate)}</span>
                        <button onClick={()=>delRecord(s.id,r.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                          <Icon name="close" size={12} color="#ff7070"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{display:"flex",gap:8}}>
                  <Btn small variant="ghost" onClick={()=>{setAddRecordModal(s.id);setRecordForm({year:selYear,month:selMonth,hours:""})}}>
                    + 新增時數
                  </Btn>
                  <Btn small variant="danger" onClick={()=>delStaff(s.id)}>刪除員工</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addStaffModal && (
        <Modal title="新增員工" onClose={()=>setAddStaffModal(false)}>
          <Field label="姓名"><input value={staffForm.name} onChange={e=>setStaffForm(f=>({...f,name:e.target.value}))} placeholder="員工姓名" style={inputStyle}/></Field>
          <Field label="時薪 (SGD)"><input type="number" value={staffForm.hourlyRate} onChange={e=>setStaffForm(f=>({...f,hourlyRate:e.target.value}))} placeholder="0.00" style={inputStyle}/></Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn onClick={saveStaff}>儲存</Btn>
            <Btn variant="ghost" onClick={()=>setAddStaffModal(false)}>取消</Btn>
          </div>
        </Modal>
      )}

      {addRecordModal && (
        <Modal title="新增工時記錄" onClose={()=>setAddRecordModal(null)}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:1}}><label style={labelStyle}>年</label><select value={recordForm.year} onChange={e=>setRecordForm(f=>({...f,year:e.target.value}))} style={inputStyle}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div style={{flex:1}}><label style={labelStyle}>月</label><select value={recordForm.month} onChange={e=>setRecordForm(f=>({...f,month:e.target.value}))} style={inputStyle}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select></div>
          </div>
          <Field label="工作時數 (hrs)"><input type="number" value={recordForm.hours} onChange={e=>setRecordForm(f=>({...f,hours:e.target.value}))} placeholder="0.00" style={inputStyle}/></Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn onClick={()=>saveRecord(addRecordModal)}>儲存</Btn>
            <Btn variant="ghost" onClick={()=>setAddRecordModal(null)}>取消</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES TAB
// ═══════════════════════════════════════════════════════════════════════════════
const EXPENSE_CATS = ["Salary","租金","Wifi","水電","Levy","其他"];

function ExpensesTab({ expenses,setExpenses,selYear,setSelYear,selMonth,setSelMonth,uid,TY,TM,curSummary,getMonthSummary }) {
  const [modal,setModal] = useState(false);
  const [form,setForm] = useState({year:TY,month:TM,category:"租金",label:"",amount:"",currency:"SGD"});
  const years = Array.from({length:6},(_,i)=>TY-i);

  const filtered = expenses.filter(e=>e.year===selYear&&e.month===selMonth);
  const total = filtered.reduce((s,e)=>s+Number(e.amountSGD||e.amount),0);
  const summary = getMonthSummary(selYear,selMonth);

  const save = () => {
    if(!form.amount) return;
    const rate = EXCHANGE[form.currency]||1;
    const amountSGD = Number(form.amount)*rate;
    setExpenses(p=>[...p,{...form,id:uid(),year:Number(form.year),month:Number(form.month),amount:Number(form.amount),amountSGD}]);
    setModal(false);
    setForm({year:TY,month:TM,category:"租金",label:"",amount:"",currency:"SGD"});
  };

  return (
    <div>
      <TabHeader title="支出管理" onAdd={()=>setModal(true)}/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,width:90}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,flex:1}}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      </div>

      {/* P&L Summary */}
      <div style={{background:"linear-gradient(135deg,rgba(30,15,60,0.8),rgba(20,10,40,0.8))",borderRadius:16,padding:18,marginBottom:16,border:"1px solid rgba(255,200,120,0.15)"}}>
        <div style={{fontSize:12,color:"#a09080",letterSpacing:1,marginBottom:12}}>本月損益概覽</div>
        <PLRow label="營業額" value={summary.rev} color="#f5d98e"/>
        <PLRow label="進貨支出" value={-summary.purchase} color="#e0b0ff" indent/>
        <PLRow label="人事支出" value={-summary.staffCost} color="#ff9eb5" indent/>
        <PLRow label="其他支出" value={-summary.otherExp} color="#b0d4ff" indent/>
        <div style={{height:1,background:"rgba(255,200,120,0.15)",margin:"10px 0"}}/>
        <PLRow label="淨利" value={summary.profit} color={summary.profit>=0?"#4ee89a":"#ff7070"} bold/>
      </div>

      {filtered.length===0 ? <EmptyState text="本月尚無支出記錄"/> : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(e=>(
            <div key={e.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid rgba(255,200,120,0.08)"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#f0e8d8"}}>{e.category}{e.label?` · ${e.label}`:""}</div>
                <div style={{fontSize:11,color:"#806050"}}>{e.year}/{pad(e.month)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#b0d4ff"}}>{CURRENCY_SYMBOLS[e.currency]||""}{Number(e.amount).toLocaleString()} {e.currency}</div>
                  {e.currency!=="SGD"&&<div style={{fontSize:11,color:"#a09080"}}>≈ S${Number(e.amountSGD||e.amount).toLocaleString()}</div>}
                </div>
                <button onClick={()=>setExpenses(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                  <Icon name="delete" size={16} color="#ff7070"/>
                </button>
              </div>
            </div>
          ))}
          <div style={{textAlign:"right",fontSize:13,color:"#a09080",padding:"4px 4px"}}>合計: <strong style={{color:"#f5d98e"}}>{fmt(total)}</strong></div>
        </div>
      )}

      {modal && (
        <Modal title="新增支出" onClose={()=>setModal(false)}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:1}}><label style={labelStyle}>年</label><select value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} style={inputStyle}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div style={{flex:1}}><label style={labelStyle}>月</label><select value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} style={inputStyle}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select></div>
          </div>
          <Field label="類別">
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inputStyle}>
              {EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="說明 (選填)"><input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="詳細說明" style={inputStyle}/></Field>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:2}}><label style={labelStyle}>金額</label><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle}/></div>
            <div style={{flex:1}}><label style={labelStyle}>貨幣</label><select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} style={inputStyle}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn onClick={save}>儲存</Btn>
            <Btn variant="ghost" onClick={()=>setModal(false)}>取消</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

const PLRow = ({ label,value,color,indent,bold }) => (
  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,paddingLeft:indent?12:0}}>
    <span style={{fontSize:12,color:"#b09080"}}>{label}</span>
    <span style={{fontSize:bold?16:13,fontWeight:bold?700:400,color}}>{value>=0?"+ ":"- "}{fmt(Math.abs(value))}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ReportsTab({ selYear,setSelYear,selMonth,setSelMonth,getMonthSummary,yearRevenue,monthlySales,monthlyPurchases,monthlyStaffCost,monthlyExpenses,TY,TM }) {
  const [reportTab, setReportTab] = useState("monthly");
  const years = Array.from({length:6},(_,i)=>TY-i);
  const [cmpYear, setCmpYear] = useState(TY-1);

  const REPORT_TABS = [
    { id:"monthly", label:"月報" },
    { id:"annual",  label:"年報" },
    { id:"compare", label:"對比" },
  ];

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:"#f5d98e",margin:"0 0 16px"}}>營運報告</h2>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {REPORT_TABS.map(t=>(
            <button key={t.id} onClick={()=>setReportTab(t.id)} style={{
              flex:1,padding:"8px 0",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:.5,
              background:reportTab===t.id?"linear-gradient(135deg,#c9a84c,#f5d98e)":"rgba(255,255,255,0.06)",
              color:reportTab===t.id?"#2a1a05":"#b09080",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {reportTab === "monthly" && (
        <MonthlyReport {...{selYear,setSelYear,selMonth,setSelMonth,getMonthSummary,years}}/>
      )}
      {reportTab === "annual" && (
        <AnnualReport {...{selYear,setSelYear,getMonthSummary,yearRevenue,years,TY}}/>
      )}
      {reportTab === "compare" && (
        <CompareReport {...{selYear,setSelYear,selMonth,setSelMonth,cmpYear,setCmpYear,getMonthSummary,yearRevenue,years,TY,TM}}/>
      )}
    </div>
  );
}

function MonthlyReport({ selYear,setSelYear,selMonth,setSelMonth,getMonthSummary,years }) {
  const s = getMonthSummary(selYear,selMonth);
  const prevM = selMonth===1?12:selMonth-1;
  const prevY = selMonth===1?selYear-1:selYear;
  const ps = getMonthSummary(prevY,prevM);
  const revGrowth = ps.rev>0?(s.rev-ps.rev)/ps.rev*100:null;

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,width:90}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,flex:1}}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      </div>

      <ReportCard title={`${selYear}年 ${MONTHS[selMonth-1]} 月報`}>
        <ReportRow label="總營業額" value={fmt(s.rev)} accent="#f5d98e"/>
        <ReportRow label="工作天數" value={`${s.days}天`}/>
        <ReportRow label="平均日營業額" value={fmt(s.avgDaily)}/>
        <Divider/>
        <ReportRow label="進貨支出" value={fmt(s.purchase)} sub={`佔 ${s.purchaseRatio.toFixed(1)}%`} accent="#e0b0ff" badge={<StatusBadge status={s.purchaseStatus}/>}/>
        <ReportRow label="人事支出" value={fmt(s.staffCost)} sub={`佔 ${s.staffRatio.toFixed(1)}%`} accent="#ff9eb5" badge={<StatusBadge status={s.staffStatus}/>}/>
        <ReportRow label="其他支出" value={fmt(s.otherExp)} accent="#b0d4ff"/>
        <ReportRow label="總支出" value={fmt(s.totalExp)}/>
        <Divider/>
        <ReportRow label="當月淨利" value={fmt(s.profit)} accent={s.profit>=0?"#4ee89a":"#ff7070"} large badge={<StatusBadge status={s.profitStatus}/>}/>
        {revGrowth!=null&&<ReportRow label="vs 上月成長率" value={`${revGrowth>=0?"+":""}${revGrowth.toFixed(1)}%`} accent={revGrowth>=0?"#4ee89a":"#ff7070"}/>}
      </ReportCard>

      {/* AI-style insight */}
      <div style={{marginTop:16,background:"rgba(255,200,120,0.05)",border:"1px solid rgba(255,200,120,0.15)",borderRadius:14,padding:16}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <Icon name="sparkle" size={14} color="#f5d98e"/>
          <span style={{fontSize:12,color:"#f5d98e",fontWeight:700,letterSpacing:1}}>月度健康評估</span>
        </div>
        <div style={{fontSize:12,color:"#b09080",lineHeight:1.7}}>
          {s.rev===0 ? "本月尚無營業記錄。" : (
            <>
              {s.profitStatus==="good" && "✦ 本月獲利表現優良，利潤率健康。"}
              {s.profitStatus==="ok" && "◈ 本月獲利尚可，可關注支出結構優化。"}
              {s.profitStatus==="poor" && "▲ 本月出現虧損，建議檢視進貨與人事比例。"}
              {" "}
              {s.purchaseStatus==="poor" && "進貨佔比偏高，建議與供應商議價或精簡庫存。"}
              {s.staffStatus==="poor" && "人事成本偏高，可評估人力排班效率。"}
              {s.days>0&&` 本月共 ${s.days} 個工作日，平均日收 ${fmt(s.avgDaily)}。`}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnualReport({ selYear,setSelYear,getMonthSummary,yearRevenue,years,TY }) {
  const yrRev  = yearRevenue(selYear);
  const yrRevP = yearRevenue(selYear-1);
  const growth = yrRevP>0?(yrRev-yrRevP)/yrRevP*100:null;

  let totalExp=0, totalProfit=0;
  for(let m=1;m<=12;m++) {
    const s=getMonthSummary(selYear,m);
    totalExp+=s.totalExp;
    totalProfit+=s.profit;
  }

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,flex:1}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
      </div>

      <ReportCard title={`${selYear} 年度報告`}>
        <ReportRow label="年度總營業額" value={fmt(yrRev)} accent="#f5d98e" large/>
        <ReportRow label="年度總支出" value={fmt(totalExp)} accent="#b0d4ff"/>
        <ReportRow label="年度淨利" value={fmt(totalProfit)} accent={totalProfit>=0?"#4ee89a":"#ff7070"} large/>
        {growth!=null&&<ReportRow label={`vs ${selYear-1}年成長率`} value={`${growth>=0?"+":""}${growth.toFixed(1)}%`} accent={growth>=0?"#4ee89a":"#ff7070"}/>}
        <ReportRow label="月均營業額" value={fmt(yrRev/12)}/>
      </ReportCard>

      <div style={{marginTop:16}}>
        <div style={{fontSize:12,color:"#a09080",marginBottom:10,letterSpacing:1}}>各月明細</div>
        {Array.from({length:12},(_,i)=>{
          const s=getMonthSummary(selYear,i+1);
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:6,border:"1px solid rgba(255,200,120,0.06)"}}>
              <div style={{width:28,fontSize:12,color:"#806050",fontWeight:700}}>{MONTH_LABELS[i]}</div>
              <div style={{flex:1}}>
                <MiniBar value={s.rev} max={Math.max(...Array.from({length:12},(_,j)=>getMonthSummary(selYear,j+1).rev),1)}/>
              </div>
              <div style={{width:90,textAlign:"right",fontSize:12,color:"#f5d98e",fontWeight:700}}>{fmt(s.rev)}</div>
              <div style={{width:70,textAlign:"right",fontSize:11,color:s.profit>=0?"#4ee89a":"#ff7070"}}>{s.profit>=0?"+":""}{fmt(s.profit)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareReport({ selYear,setSelYear,selMonth,setSelMonth,cmpYear,setCmpYear,getMonthSummary,yearRevenue,years,TY,TM }) {
  const [mode,setMode] = useState("month"); // month | year
  const years2 = years.filter(y=>y!==selYear);

  if (mode==="month") {
    const a = getMonthSummary(selYear,selMonth);
    const b = getMonthSummary(cmpYear,selMonth);
    const revDiff = b.rev>0?(a.rev-b.rev)/b.rev*100:null;

    return (
      <div>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          <button onClick={()=>setMode("month")} style={{flex:1,padding:"7px 0",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#c9a84c,#f5d98e)",color:"#2a1a05"}}>月份對比</button>
          <button onClick={()=>setMode("year")}  style={{flex:1,padding:"7px 0",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"rgba(255,255,255,0.06)",color:"#b09080"}}>年度對比</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,flex:1}}>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select>
          <span style={{color:"#806050",fontSize:12}}>vs</span>
          <select value={cmpYear} onChange={e=>setCmpYear(Number(e.target.value))} style={{...inputStyle,flex:1}}>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select>
        </div>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{...inputStyle,width:"100%",marginBottom:16}}>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>

        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:14,border:"1px solid rgba(255,200,120,0.15)"}}>
            <div style={{fontSize:11,color:"#f5d98e",marginBottom:8,fontWeight:700}}>{selYear}年 {MONTHS[selMonth-1]}</div>
            <CmpMetric label="營業額" value={fmt(a.rev)}/>
            <CmpMetric label="淨利" value={fmt(a.profit)} color={a.profit>=0?"#4ee89a":"#ff7070"}/>
            <CmpMetric label="工作天" value={`${a.days}天`}/>
          </div>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:14,border:"1px solid rgba(200,180,120,0.1)"}}>
            <div style={{fontSize:11,color:"#b09080",marginBottom:8,fontWeight:700}}>{cmpYear}年 {MONTHS[selMonth-1]}</div>
            <CmpMetric label="營業額" value={fmt(b.rev)}/>
            <CmpMetric label="淨利" value={fmt(b.profit)} color={b.profit>=0?"#4ee89a":"#ff7070"}/>
            <CmpMetric label="工作天" value={`${b.days}天`}/>
          </div>
        </div>
        {revDiff!=null&&(
          <div style={{background:"rgba(255,200,120,0.06)",border:"1px solid rgba(255,200,120,0.15)",borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#a09080",marginBottom:4}}>營業額成長率</div>
            <div style={{fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif",color:revDiff>=0?"#4ee89a":"#ff7070"}}>
              {revDiff>=0?"+":""}{revDiff.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    );
  }

  // Year mode
  const aRev = yearRevenue(selYear);
  const bRev = yearRevenue(cmpYear);
  const yDiff = bRev>0?(aRev-bRev)/bRev*100:null;

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <button onClick={()=>setMode("month")} style={{flex:1,padding:"7px 0",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"rgba(255,255,255,0.06)",color:"#b09080"}}>月份對比</button>
        <button onClick={()=>setMode("year")} style={{flex:1,padding:"7px 0",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#c9a84c,#f5d98e)",color:"#2a1a05"}}>年度對比</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center"}}>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{...inputStyle,flex:1}}>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select>
        <span style={{color:"#806050",fontSize:12}}>vs</span>
        <select value={cmpYear} onChange={e=>setCmpYear(Number(e.target.value))} style={{...inputStyle,flex:1}}>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:14,border:"1px solid rgba(255,200,120,0.15)"}}>
          <div style={{fontSize:11,color:"#f5d98e",marginBottom:8,fontWeight:700}}>{selYear} 年</div>
          <CmpMetric label="年營業額" value={fmt(aRev)}/>
          <CmpMetric label="月均" value={fmt(aRev/12)}/>
        </div>
        <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:14,border:"1px solid rgba(200,180,120,0.1)"}}>
          <div style={{fontSize:11,color:"#b09080",marginBottom:8,fontWeight:700}}>{cmpYear} 年</div>
          <CmpMetric label="年營業額" value={fmt(bRev)}/>
          <CmpMetric label="月均" value={fmt(bRev/12)}/>
        </div>
      </div>

      {yDiff!=null&&(
        <div style={{background:"rgba(255,200,120,0.06)",border:"1px solid rgba(255,200,120,0.15)",borderRadius:12,padding:14,textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:11,color:"#a09080",marginBottom:4}}>年度成長率</div>
          <div style={{fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif",color:yDiff>=0?"#4ee89a":"#ff7070"}}>
            {yDiff>=0?"+":""}{yDiff.toFixed(1)}%
          </div>
        </div>
      )}

      <div style={{fontSize:12,color:"#a09080",marginBottom:10,letterSpacing:1}}>月份對照表</div>
      {Array.from({length:12},(_,i)=>{
        const as=getMonthSummary(selYear,i+1);
        const bs=getMonthSummary(cmpYear,i+1);
        const g=bs.rev>0?(as.rev-bs.rev)/bs.rev*100:null;
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:5,border:"1px solid rgba(255,200,120,0.06)"}}>
            <div style={{width:28,fontSize:12,color:"#806050",fontWeight:700}}>{MONTH_LABELS[i]}</div>
            <div style={{flex:1,fontSize:12,color:"#f5d98e"}}>{fmt(as.rev)}</div>
            <div style={{flex:1,fontSize:12,color:"#b09080"}}>{fmt(bs.rev)}</div>
            <div style={{width:60,textAlign:"right",fontSize:11,color:g==null?"#606060":g>=0?"#4ee89a":"#ff7070"}}>
              {g!=null?`${g>=0?"+":""}${g.toFixed(1)}%`:"–"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Small UI helpers ──────────────────────────────────────────────────────────
const SectionTitle = ({ icon,label }) => (
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
    <Icon name={icon} size={14} color="#c9a84c"/>
    <span style={{fontSize:11,color:"#a09080",letterSpacing:1.5,textTransform:"uppercase",fontWeight:700}}>{label}</span>
  </div>
);

const TabHeader = ({ title,onAdd }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
    <h2 style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:"#f5d98e",margin:0}}>{title}</h2>
    <Btn small onClick={onAdd}><span style={{display:"flex",alignItems:"center",gap:4}}><Icon name="add" size={14} color="#2a1a05"/>新增</span></Btn>
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{textAlign:"center",padding:"40px 20px",color:"#605040",fontSize:13}}>
    <div style={{fontSize:32,marginBottom:8}}>✦</div>
    {text}
  </div>
);

const ReportCard = ({ title,children }) => (
  <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,padding:18,border:"1px solid rgba(255,200,120,0.12)"}}>
    <div style={{fontSize:14,fontWeight:700,color:"#f5d98e",marginBottom:16,fontFamily:"'Playfair Display',serif"}}>{title}</div>
    {children}
  </div>
);

const ReportRow = ({ label,value,sub,accent,large,badge }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"4px 0"}}>
    <span style={{fontSize:12,color:"#b09080"}}>{label}{sub&&<span style={{color:"#706050",marginLeft:4}}>{sub}</span>}</span>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {badge}
      <span style={{fontSize:large?18:13,fontWeight:large?700:400,color:accent||"#f0e8d8",fontFamily:large?"'Playfair Display',serif":"inherit"}}>{value}</span>
    </div>
  </div>
);

const CmpMetric = ({ label,value,color }) => (
  <div style={{marginBottom:6}}>
    <div style={{fontSize:10,color:"#807060",letterSpacing:.5}}>{label}</div>
    <div style={{fontSize:15,fontWeight:700,color:color||"#f0e8d8"}}>{value}</div>
  </div>
);

const Divider = () => <div style={{height:1,background:"rgba(255,200,120,0.1)",margin:"10px 0"}}/>;
