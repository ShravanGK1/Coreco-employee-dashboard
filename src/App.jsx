import { useState, useEffect, useContext, useReducer, useRef, useMemo, useCallback, useLayoutEffect, createContext } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ───────────────────────────────────────────────────────
const SUPABASE_URL = "https://bblkrxjyfmqvupmctifa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGtyeGp5Zm1xdnVwbWN0aWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTA0NDEsImV4cCI6MjA5ODI4NjQ0MX0.ETP_1Pk-QtO2rxY-Djo5cSIBIzuHyaoJaRw6MgQCKnc";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CONTEXT ───────────────────────────────────────────────────────────────
const AppContext = createContext();

// ─── REDUCER ───────────────────────────────────────────────────────────────
const initialState = {
  employees: [],
  loading: false,
  error: null,
  editingEmployee: null,
};

function employeeReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":    return { ...state, loading: action.payload };
    case "SET_ERROR":      return { ...state, error: action.payload, loading: false };
    case "SET_EMPLOYEES":  return { ...state, employees: action.payload, loading: false };
    case "ADD_EMPLOYEE":   return { ...state, employees: [action.payload, ...state.employees] };
    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.map((e) => e.id === action.payload.id ? action.payload : e),
        editingEmployee: null,
      };
    case "DELETE_EMPLOYEE": return { ...state, employees: state.employees.filter((e) => e.id !== action.payload) };
    case "SET_EDITING":    return { ...state, editingEmployee: action.payload };
    default: return state;
  }
}

// ─── CUSTOM HOOK: useFetchEmployees ────────────────────────────────────────
const MOCK_EMPLOYEES = [
  { id:1,  firstName:"Emily",   lastName:"Carter",    email:"emily.carter@corp.com",    phone:"555-0101", department:"Engineering", role:"Senior Engineer",       status:"Active",   avatar:"" },
  { id:2,  firstName:"James",   lastName:"Patel",     email:"james.patel@corp.com",     phone:"555-0102", department:"Engineering", role:"Frontend Developer",    status:"Active",   avatar:"" },
  { id:3,  firstName:"Sofia",   lastName:"Nguyen",    email:"sofia.nguyen@corp.com",    phone:"555-0103", department:"Design",      role:"UX Designer",           status:"Active",   avatar:"" },
  { id:4,  firstName:"Liam",    lastName:"Brooks",    email:"liam.brooks@corp.com",     phone:"555-0104", department:"Marketing",   role:"Marketing Lead",        status:"Active",   avatar:"" },
  { id:5,  firstName:"Aisha",   lastName:"Rahman",    email:"aisha.rahman@corp.com",    phone:"555-0105", department:"HR",          role:"HR Manager",            status:"Inactive", avatar:"" },
  { id:6,  firstName:"Noah",    lastName:"Kim",       email:"noah.kim@corp.com",        phone:"555-0106", department:"Finance",     role:"Financial Analyst",     status:"Active",   avatar:"" },
  { id:7,  firstName:"Priya",   lastName:"Sharma",    email:"priya.sharma@corp.com",    phone:"555-0107", department:"Engineering", role:"Backend Developer",     status:"Active",   avatar:"" },
  { id:8,  firstName:"Carlos",  lastName:"Mendez",    email:"carlos.mendez@corp.com",   phone:"555-0108", department:"Sales",       role:"Sales Manager",         status:"Active",   avatar:"" },
  { id:9,  firstName:"Mia",     lastName:"Johnson",   email:"mia.johnson@corp.com",     phone:"555-0109", department:"Operations",  role:"Ops Coordinator",       status:"Inactive", avatar:"" },
  { id:10, firstName:"Ethan",   lastName:"Wu",        email:"ethan.wu@corp.com",        phone:"555-0110", department:"Engineering", role:"DevOps Engineer",       status:"Active",   avatar:"" },
  { id:11, firstName:"Zara",    lastName:"Ahmed",     email:"zara.ahmed@corp.com",      phone:"555-0111", department:"Design",      role:"Product Designer",      status:"Active",   avatar:"" },
  { id:12, firstName:"Lucas",   lastName:"Silva",     email:"lucas.silva@corp.com",     phone:"555-0112", department:"Marketing",   role:"Content Strategist",    status:"Active",   avatar:"" },
  { id:13, firstName:"Ava",     lastName:"Thompson",  email:"ava.thompson@corp.com",    phone:"555-0113", department:"Finance",     role:"Accountant",            status:"Active",   avatar:"" },
  { id:14, firstName:"Omar",    lastName:"Hassan",    email:"omar.hassan@corp.com",     phone:"555-0114", department:"Legal",       role:"Legal Counsel",         status:"Active",   avatar:"" },
  { id:15, firstName:"Chloe",   lastName:"Park",      email:"chloe.park@corp.com",      phone:"555-0115", department:"Support",     role:"Support Lead",          status:"Inactive", avatar:"" },
  { id:16, firstName:"Ryan",    lastName:"OBrien",    email:"ryan.obrien@corp.com",     phone:"555-0116", department:"Sales",       role:"Account Executive",     status:"Active",   avatar:"" },
  { id:17, firstName:"Nina",    lastName:"Petrov",    email:"nina.petrov@corp.com",     phone:"555-0117", department:"HR",          role:"Recruiter",             status:"Active",   avatar:"" },
  { id:18, firstName:"Arjun",   lastName:"Mehta",     email:"arjun.mehta@corp.com",     phone:"555-0118", department:"Engineering", role:"Full Stack Developer",  status:"Active",   avatar:"" },
  { id:19, firstName:"Isabel",  lastName:"Ferreira",  email:"isabel.ferreira@corp.com", phone:"555-0119", department:"Operations",  role:"Project Manager",       status:"Active",   avatar:"" },
  { id:20, firstName:"Daniel",  lastName:"Lee",       email:"daniel.lee@corp.com",      phone:"555-0120", department:"Finance",     role:"CFO",                   status:"Active",   avatar:"" },
];

// ─── SUPABASE CRUD HELPERS ─────────────────────────────────────────────────
const db = {
  async fetchAll() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("id", { ascending: false });
    if (error) throw error;
    return data;
  },
  async insert(emp) {
    const { id, ...rest } = emp; // strip local id, let Supabase generate
    const { data, error } = await supabase
      .from("employees")
      .insert([rest])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(emp) {
    const { data, error } = await supabase
      .from("employees")
      .update(emp)
      .eq("id", emp.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
  async seedIfEmpty(seeds) {
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true });
    if (count === 0) {
      const rows = seeds.map(({ id, ...rest }) => rest);
      await supabase.from("employees").insert(rows);
    }
  },
};

// ─── CUSTOM HOOK: useFetchEmployees (Supabase) ─────────────────────────────
function useFetchEmployees(dispatch) {
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    dispatch({ type: "SET_LOADING", payload: true });
    (async () => {
      try {
        // Seed table with mock data if it is empty (first ever load)
        await db.seedIfEmpty(MOCK_EMPLOYEES);
        const data = await db.fetchAll();
        dispatch({ type: "SET_EMPLOYEES", payload: data });
      } catch (err) {
        console.error("Supabase fetch error:", err);
        dispatch({ type: "SET_ERROR", payload: "Failed to connect to database." });
      }
    })();
  }, [dispatch]);
}

// ─── CUSTOM HOOK: useFormValidation ────────────────────────────────────────
function useFormValidation(fields) {
  const [errors, setErrors] = useState({});
  const validate = useCallback(() => {
    const newErrors = {};
    if (!fields.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!fields.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!fields.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) newErrors.email = "Invalid email";
    if (!fields.department?.trim()) newErrors.department = "Department is required";
    if (!fields.role?.trim()) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields]);
  const clearErrors = useCallback(() => setErrors({}), []);
  return { errors, validate, clearErrors };
}

// ─── PROVIDER ──────────────────────────────────────────────────────────────
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(employeeReducer, initialState);
  const [theme, setTheme] = useState("light");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  useFetchEmployees(dispatch);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);
  return (
    <AppContext.Provider value={{ state, dispatch, theme, toggleTheme, search, setSearch, filterDept, setFilterDept, filterStatus, setFilterStatus }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────
function GlobalStyles({ theme }) {
  const dark = theme === "dark";
  useLayoutEffect(() => {
    document.body.style.margin = "0";
    document.body.style.fontFamily = "system-ui, -apple-system, sans-serif";
  }, []);
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; }
      .app {
        min-height: 100vh;
        background: ${dark ? "#0f1117" : "#f4f5f7"};
        color: ${dark ? "#e8eaf0" : "#1a1d2e"};
        transition: background 0.25s, color 0.25s;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .navbar {
        background: ${dark ? "#1a1d2e" : "#ffffff"};
        border-bottom: 1px solid ${dark ? "#2e3347" : "#e4e6ef"};
        padding: 0 24px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .logo { font-size: 18px; font-weight: 700; color: ${dark ? "#818cf8" : "#4f46e5"}; display: flex; align-items: center; gap: 8px; }
      .nav-actions { display: flex; align-items: center; gap: 10px; }
      .main { max-width: 1280px; margin: 0 auto; padding: 24px 16px; }
      .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
      .stat-card {
        background: ${dark ? "#1a1d2e" : "#ffffff"};
        border: 1px solid ${dark ? "#2e3347" : "#e4e6ef"};
        border-radius: 12px;
        padding: 16px 18px;
      }
      .stat-label { font-size: 12px; color: ${dark ? "#6b7280" : "#6b7280"}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
      .stat-value { font-size: 26px; font-weight: 700; }
      .toolbar {
        background: ${dark ? "#1a1d2e" : "#ffffff"};
        border: 1px solid ${dark ? "#2e3347" : "#e4e6ef"};
        border-radius: 12px;
        padding: 14px 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-bottom: 18px;
      }
      .search-wrap { position: relative; flex: 1; min-width: 200px; }
      .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: ${dark ? "#6b7280" : "#9ca3af"}; font-size: 15px; }
      .input {
        width: 100%;
        padding: 8px 12px 8px 32px;
        border: 1px solid ${dark ? "#2e3347" : "#d1d5db"};
        border-radius: 8px;
        background: ${dark ? "#0f1117" : "#f9fafb"};
        color: ${dark ? "#e8eaf0" : "#1a1d2e"};
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
      }
      .input:focus { border-color: #4f46e5; }
      .select {
        padding: 8px 12px;
        border: 1px solid ${dark ? "#2e3347" : "#d1d5db"};
        border-radius: 8px;
        background: ${dark ? "#0f1117" : "#f9fafb"};
        color: ${dark ? "#e8eaf0" : "#1a1d2e"};
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }
      .btn {
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .btn-primary { background: #4f46e5; color: #fff; }
      .btn-primary:hover { background: #4338ca; }
      .btn-ghost { background: transparent; color: ${dark ? "#9ca3af" : "#6b7280"}; border: 1px solid ${dark ? "#2e3347" : "#e4e6ef"}; }
      .btn-ghost:hover { background: ${dark ? "#2e3347" : "#f3f4f6"}; }
      .btn-sm { padding: 5px 10px; font-size: 13px; }
      .btn-danger { background: #fee2e2; color: #dc2626; border: none; }
      .btn-danger:hover { background: #fecaca; }
      .btn-edit { background: #ede9fe; color: #7c3aed; border: none; }
      .btn-edit:hover { background: #ddd6fe; }
      .table-wrap {
        background: ${dark ? "#1a1d2e" : "#ffffff"};
        border: 1px solid ${dark ? "#2e3347" : "#e4e6ef"};
        border-radius: 12px;
        overflow: hidden;
      }
      table { width: 100%; border-collapse: collapse; }
      thead th {
        background: ${dark ? "#151828" : "#f9fafb"};
        padding: 12px 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: ${dark ? "#6b7280" : "#6b7280"};
        border-bottom: 1px solid ${dark ? "#2e3347" : "#e4e6ef"};
        white-space: nowrap;
      }
      tbody tr {
        border-bottom: 1px solid ${dark ? "#2e3347" : "#f3f4f6"};
        transition: background 0.1s;
      }
      tbody tr:last-child { border-bottom: none; }
      tbody tr:hover { background: ${dark ? "#1f2337" : "#f9fafb"}; }
      td { padding: 12px 16px; font-size: 14px; vertical-align: middle; }
      .avatar {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: #ede9fe;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 600; color: #7c3aed;
        overflow: hidden;
      }
      .avatar img { width: 100%; height: 100%; object-fit: cover; }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }
      .badge-active { background: #d1fae5; color: #065f46; }
      .badge-inactive { background: #fee2e2; color: #991b1b; }
      .badge-dept { background: ${dark ? "#1e1b4b" : "#ede9fe"}; color: ${dark ? "#a5b4fc" : "#7c3aed"}; }
      .actions { display: flex; gap: 6px; }
      .modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000;
        padding: 16px;
      }
      .modal {
        background: ${dark ? "#1a1d2e" : "#ffffff"};
        border-radius: 16px;
        padding: 28px;
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-title { font-size: 18px; font-weight: 700; margin: 0 0 20px; }
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      .form-group.full { grid-column: 1 / -1; }
      label { font-size: 13px; font-weight: 500; color: ${dark ? "#9ca3af" : "#374151"}; }
      .form-input {
        padding: 9px 12px;
        border: 1px solid ${dark ? "#2e3347" : "#d1d5db"};
        border-radius: 8px;
        background: ${dark ? "#0f1117" : "#f9fafb"};
        color: ${dark ? "#e8eaf0" : "#1a1d2e"};
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
      }
      .form-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
      .form-input.err { border-color: #dc2626; }
      .error-text { font-size: 12px; color: #dc2626; }
      .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }
      .empty { text-align: center; padding: 60px 20px; color: ${dark ? "#6b7280" : "#9ca3af"}; }
      .empty-icon { font-size: 40px; margin-bottom: 12px; }
      .theme-btn { font-size: 18px; background: none; border: none; cursor: pointer; padding: 6px; }
      .login-wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${dark ? "#0f1117" : "#f4f5f7"};
        padding: 16px;
      }
      .login-card {
        background: ${dark ? "#1a1d2e" : "#ffffff"};
        border-radius: 16px;
        padding: 40px;
        width: 100%;
        max-width: 400px;
        border: 1px solid ${dark ? "#2e3347" : "#e4e6ef"};
      }
      .login-logo { text-align: center; font-size: 22px; font-weight: 700; color: #4f46e5; margin-bottom: 8px; }
      .login-sub { text-align: center; font-size: 14px; color: ${dark ? "#6b7280" : "#6b7280"}; margin-bottom: 28px; }
      .login-field { margin-bottom: 16px; }
      .login-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; color: ${dark ? "#9ca3af" : "#374151"}; }
      .login-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid ${dark ? "#2e3347" : "#d1d5db"};
        border-radius: 8px;
        background: ${dark ? "#0f1117" : "#f9fafb"};
        color: ${dark ? "#e8eaf0" : "#1a1d2e"};
        font-size: 14px;
        outline: none;
      }
      .login-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
      .login-btn { width: 100%; padding: 11px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
      .login-btn:hover { background: #4338ca; }
      .login-err { font-size: 13px; color: #dc2626; text-align: center; margin-top: 10px; }
      .login-hint { font-size: 12px; color: ${dark ? "#6b7280" : "#9ca3af"}; text-align: center; margin-top: 16px; }
      .count-badge { background: #4f46e5; color: #fff; border-radius: 12px; font-size: 12px; padding: 1px 7px; margin-left: 4px; }
      /* ── Tablet (max 768px) ── */
      @media (max-width: 768px) {
        .navbar { padding: 0 16px; height: 56px; }
        .nav-username { display: none; }
        .main { padding: 16px 12px; }
        .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
        .stat-card { padding: 12px 14px; }
        .stat-value { font-size: 22px; }
        .toolbar { padding: 10px 12px; gap: 8px; }
        .search-wrap { min-width: 100%; order: -1; }
        .select { flex: 1; }
        .btn-add-full { width: 100%; justify-content: center; }
        /* Hide less-important table columns on tablet */
        td:nth-child(4), th:nth-child(4) { display: none; }
        .modal { padding: 20px; }
      }

      /* ── Mobile (max 480px) ── */
      @media (max-width: 480px) {
        .navbar { height: 52px; }
        .logo { font-size: 16px; }
        .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .stat-value { font-size: 20px; }
        .stat-label { font-size: 11px; }

        /* Switch table to card layout */
        .table-wrap { border-radius: 12px; overflow: hidden; }
        table, thead, tbody, tr, td, th { display: block; width: 100%; }
        thead { display: none; }
        tbody tr {
          border: 1px solid transparent;
          border-bottom: 1px solid rgba(107,114,128,0.15) !important;
          padding: 14px 14px 10px;
          position: relative;
        }
        tbody tr:last-child { border-bottom: none !important; }
        td { padding: 3px 0; border: none; font-size: 13px; }
        /* Employee name cell — larger */
        td:nth-child(1) { padding-bottom: 8px; }
        td:nth-child(1) > div { gap: 10px; }
        /* Department */
        td:nth-child(2)::before { content: "Dept: "; font-size: 11px; color: #6b7280; font-weight: 500; }
        /* Role */
        td:nth-child(3)::before { content: "Role: "; font-size: 11px; color: #6b7280; font-weight: 500; }
        /* Email — hidden on mobile, shown in name cell via phone */
        td:nth-child(4) { display: none; }
        /* Status */
        td:nth-child(5) { display: inline-block; margin-top: 4px; }
        /* Actions — right-aligned at bottom */
        td:nth-child(6) { margin-top: 10px; }
        td:nth-child(6) .actions { justify-content: flex-end; }

        /* Form grid single column */
        .form-grid { grid-template-columns: 1fr; }

        /* Modal full-screen on mobile */
        .modal-overlay { padding: 0; align-items: flex-end; }
        .modal {
          border-radius: 20px 20px 0 0;
          max-height: 92vh;
          padding: 20px 16px 28px;
        }

        /* Toolbar stack */
        .toolbar { flex-direction: column; align-items: stretch; }
        .select { width: 100%; }
        .btn-add-full { width: 100%; justify-content: center; }

        /* Login card padding */
        .login-card { padding: 28px 20px; }
      }
    `}</style>
  );
}

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const { theme, toggleTheme } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef();

  useLayoutEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    setTimeout(() => {
      if (email === "admin@company.com" && password === "admin123") {
        onLogin({ name: "Admin User", email });
      } else {
        setError("Invalid credentials. Use admin@company.com / admin123");
        setLoading(false);
      }
    }, 800);
  }, [email, password, onLogin]);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <button className="theme-btn" style={{ float: "right", marginTop: -8 }} onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div className="login-logo">👥 EmpDesk</div>
        <div className="login-sub">Sign in to your workspace</div>
        <div className="login-field">
          <label className="login-label">Email address</label>
          <input ref={emailRef} className="login-input" type="email" placeholder="admin@company.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>
        <div className="login-field">
          <label className="login-label">Password</label>
          <input className="login-input" type="password" placeholder="••••••••" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>
        {error && <div className="login-err">{error}</div>}
        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <div className="login-hint">Demo: admin@company.com / admin123</div>
      </div>
    </div>
  );
}

// ─── EMPLOYEE FORM MODAL ───────────────────────────────────────────────────
const DEPARTMENTS = ["Engineering", "Marketing", "Sales", "Finance", "HR", "Design", "Operations", "Legal", "Support"];

// Defined OUTSIDE EmployeeModal so React never remounts it on re-render
function FormField({ label, name, type = "text", full, value, error, onChange }) {
  return (
    <div className={`form-group${full ? " full" : ""}`}>
      <label>{label}</label>
      <input
        className={`form-input${error ? " err" : ""}`}
        type={type}
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

function EmployeeModal({ onClose }) {
  const { state, dispatch } = useContext(AppContext);
  const editing = state.editingEmployee;

  // Fix 2: initialise lazily from editing so the correct data is always used
  const [form, setForm] = useState(() =>
    editing
      ? { ...editing }
      : { firstName: "", lastName: "", email: "", phone: "", department: "", role: "", status: "Active" }
  );

  // Fix 3: sync form if editingEmployee changes after mount (e.g. rapid open)
  useEffect(() => {
    if (editing) setForm({ ...editing });
  }, [editing]);

  const { errors, validate, clearErrors } = useFormValidation(form);

  const handleChange = useCallback((key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    clearErrors();
  }, [clearErrors]);

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await db.update({ ...form });
        dispatch({ type: "UPDATE_EMPLOYEE", payload: updated });
      } else {
        const payload = {
          ...form,
          avatar: `https://ui-avatars.com/api/?name=${form.firstName}+${form.lastName}&background=ede9fe&color=7c3aed`,
        };
        const inserted = await db.insert(payload);
        dispatch({ type: "ADD_EMPLOYEE", payload: inserted });
      }
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save employee. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [validate, editing, dispatch, form, onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{editing ? "Edit Employee" : "Add Employee"}</div>
        <div className="form-grid">
          <FormField label="First name *" name="firstName" value={form.firstName} error={errors.firstName} onChange={handleChange} />
          <FormField label="Last name *"  name="lastName"  value={form.lastName}  error={errors.lastName}  onChange={handleChange} />
          <FormField label="Email *"      name="email"     value={form.email}     error={errors.email}     onChange={handleChange} type="email" />
          <FormField label="Phone"        name="phone"     value={form.phone}                              onChange={handleChange} />
          <div className="form-group">
            <label>Department *</label>
            <select className={`form-input${errors.department ? " err" : ""}`}
              value={form.department || ""}
              onChange={(e) => handleChange("department", e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            {errors.department && <span className="error-text">{errors.department}</span>}
          </div>
          <FormField label="Role / Title *" name="role" value={form.role} error={errors.role} onChange={handleChange} />
          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add employee"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const { state, dispatch, theme, toggleTheme, search, setSearch, filterDept, setFilterDept, filterStatus, setFilterStatus } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const headerRef = useRef();

  useLayoutEffect(() => {
    if (headerRef.current) headerRef.current.style.opacity = "1";
  }, []);

  const departments = useMemo(() => {
    const depts = [...new Set(state.employees.map((e) => e.department))].sort();
    return ["All", ...depts];
  }, [state.employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return state.employees.filter((e) => {
      const matchSearch = !q || `${e.firstName} ${e.lastName} ${e.email} ${e.role} ${e.department}`.toLowerCase().includes(q);
      const matchDept = filterDept === "All" || e.department === filterDept;
      const matchStatus = filterStatus === "All" || e.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [state.employees, search, filterDept, filterStatus]);

  const stats = useMemo(() => ({
    total: state.employees.length,
    active: state.employees.filter((e) => e.status === "Active").length,
    inactive: state.employees.filter((e) => e.status === "Inactive").length,
    depts: new Set(state.employees.map((e) => e.department)).size,
  }), [state.employees]);

  const handleEdit = useCallback((emp) => {
    dispatch({ type: "SET_EDITING", payload: emp });
    setShowModal(true);
  }, [dispatch]);

  const handleDelete = useCallback(async (id) => {
    try {
      await db.remove(id);
      dispatch({ type: "DELETE_EMPLOYEE", payload: id });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete employee. Please try again.");
    }
    setDeleteId(null);
  }, [dispatch]);

  const handleAddNew = useCallback(() => {
    dispatch({ type: "SET_EDITING", payload: null });
    setShowModal(true);
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    dispatch({ type: "SET_EDITING", payload: null });
  }, [dispatch]);

  const initials = (e) => `${e.firstName?.[0] || ""}${e.lastName?.[0] || ""}`;

  return (
    <div className="app">
      <nav className="navbar" ref={headerRef} style={{ opacity: 0, transition: "opacity 0.3s" }}>
        <div className="logo">👥 EmpDesk</div>
        <div className="nav-actions">
          <span className="nav-username" style={{ fontSize: 13, color: theme === "dark" ? "#6b7280" : "#6b7280" }}>{user.name}</span>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      <div className="main">
        {/* Stats */}
        <div className="stat-grid">
          {[
            { label: "Total Employees", value: stats.total, color: "#4f46e5" },
            { label: "Active", value: stats.active, color: "#059669" },
            { label: "Inactive", value: stats.inactive, color: "#dc2626" },
            { label: "Departments", value: stats.depts, color: "#d97706" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="input" placeholder="Search by name, email, role…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{flex:"1",minWidth:120}} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select className="select" style={{flex:"1",minWidth:100}} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {["All", "Active", "Inactive"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary btn-add-full" onClick={handleAddNew}>+ Add employee</button>
        </div>

        {/* Table */}
        {state.loading ? (
          <div className="empty"><div className="empty-icon">⏳</div><div>Loading employees…</div></div>
        ) : state.error ? (
          <div className="empty"><div className="empty-icon">⚠️</div><div>{state.error}</div></div>
        ) : (
          <div className="table-wrap">
            <div style={{overflowX:"auto"}}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty"><div className="empty-icon">🔍</div><div>No employees match your filters.</div></div>
                  </td></tr>
                ) : filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar">
                          {emp.avatar
                            ? <img src={emp.avatar} alt={initials(emp)} onError={(e) => { e.target.style.display = "none"; }} />
                            : initials(emp)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{emp.phone || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-dept">{emp.department}</span></td>
                    <td style={{ color: "#6b7280" }}>{emp.role}</td>
                    <td style={{ fontSize: 13 }}>{emp.email}</td>
                    <td>
                      <span className={`badge ${emp.status === "Active" ? "badge-active" : "badge-inactive"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-edit" onClick={() => handleEdit(emp)}>✏️ Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(emp.id)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", borderTop: `1px solid ${theme === "dark" ? "#2e3347" : "#f3f4f6"}` }}>
              Showing {filtered.length} of {state.employees.length} employees
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && <EmployeeModal onClose={handleCloseModal} />}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-title">Delete employee?</div>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 0 }}>This action cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: "#dc2626" }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
function AppContent() {
  const { theme } = useContext(AppContext);
  const [user, setUser] = useState(null);
  return (
    <>
      <GlobalStyles theme={theme} />
      {user
        ? <Dashboard user={user} onLogout={() => setUser(null)} />
        : <LoginPage onLogin={setUser} />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}