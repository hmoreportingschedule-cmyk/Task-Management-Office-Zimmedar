 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const fmt = v => v ? new Date(v).toLocaleString("en-IN") : "-";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("overview");

  async function load() {
    const r = await fetch("/api/dashboard", { cache: "no-store" });
    const d = await r.json();
    if (!d.ok) return router.push("/");
    setData(d);
  }

  useEffect(() => { load(); }, []);

  async function attendance(action, status="Present") {
    const r = await fetch("/api/attendance", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action,status})
    });
    const d = await r.json(); setMsg(d.message); if(d.ok) load();
  }

  async function updateTask(taskId, status) {
    let closingRemark = "";
    if (status === "Complete" || status === "Closed") {
      closingRemark = prompt("Closing remark likhiye:") || "";
    }
    const r = await fetch("/api/tasks", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({taskId,status,closingRemark})
    });
    const d = await r.json(); setMsg(d.message); if(d.ok) load();
  }

  async function logout() {
    await fetch("/api/auth/logout",{method:"POST"});
    router.push("/");
  }

  if (!data) return <div className="loading">Loading dashboard...</div>;
  const {user, summary, tasks, attendance, employees} = data;
  const canAssign = ["HOD","Admin","Management"].includes(user.role);

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="sideBrand"><span>OW</span><b>Office Work</b></div>
        <button className={tab==="overview"?"nav active":"nav"} onClick={()=>setTab("overview")}>▦ Overview</button>
        <button className={tab==="tasks"?"nav active":"nav"} onClick={()=>setTab("tasks")}>✓ Tasks</button>
        <button className={tab==="attendance"?"nav active":"nav"} onClick={()=>setTab("attendance")}>◷ Attendance</button>
        {canAssign && <button className={tab==="assign"?"nav active":"nav"} onClick={()=>setTab("assign")}>＋ Assign Task</button>}
        {canAssign && <button className={tab==="employees"?"nav active":"nav"} onClick={()=>setTab("employees")}>♙ Employees</button>}
        <button className="nav logoutNav" onClick={logout}>↪ Logout</button>
      </aside>

      <section className="content">
        <header className="top">
          <div><h2>{user.role} Dashboard</h2><span className="muted">{user.office || "Head Office"}</span></div>
          <div className="userPill"><span className="avatar">{String(user.name||"U").slice(0,1)}</span>{user.name}</div>
        </header>

        {msg && <div className="toast" onClick={()=>setMsg("")}>{msg}</div>}

        {tab==="overview" && <>
          <div className="cards">
            <Card t="Total Tasks" v={summary.total} />
            <Card t="Pending" v={summary.pending} />
            <Card t="Complete" v={summary.complete} />
            <Card t="Incomplete" v={summary.incomplete} />
            <Card t="Closed" v={summary.closed} />
            <Card t="Delay" v={summary.delayed} />
            <Card t="Performance" v={summary.percentage+"%"} />
            <Card t="Weightage" v={summary.weightage} />
          </div>
          <div className="grid2">
            <div className="panel">
              <h3>Today's Attendance</h3>
              <div className="actions">
                <button className="success" onClick={()=>attendance("login","Present")}>Present</button>
                <button className="warning" onClick={()=>attendance("login","Late")}>Late</button>
                <button className="secondary" onClick={()=>attendance("login","Half Day")}>Half Day</button>
                <button className="danger" onClick={()=>attendance("login","Leave")}>Leave</button>
                <button className="dark" onClick={()=>attendance("logout")}>Logout Time</button>
              </div>
            </div>
            <div className="panel">
              <h3>Performance</h3>
              <div className="progress"><span style={{width:`${summary.percentage}%`}} /></div>
              <strong className="big">{summary.percentage}%</strong>
              <p className="muted">Task completion performance</p>
            </div>
          </div>
          <TaskTable tasks={tasks.slice(0,8)} user={user} updateTask={updateTask}/>
        </>}

        {tab==="tasks" && <TaskTable tasks={tasks} user={user} updateTask={updateTask}/>}
        {tab==="attendance" && <AttendanceTable data={attendance}/>}
        {tab==="employees" && <EmployeeTable data={employees}/>}
        {tab==="assign" && <Assign employees={employees} onDone={()=>{setTab("tasks");load();}}/>}
      </section>
    </main>
  );
}

function Card({t,v}) { return <div className="card"><div className="muted">{t}</div><div className="cardValue">{v}</div></div>; }

function TaskTable({tasks,user,updateTask}) {
  return <div className="panel"><div className="panelHead"><h3>Task Management</h3><span className="muted">{tasks.length} records</span></div>
    <div className="tableWrap"><table><thead><tr><th>Task</th><th>Employee</th><th>Category</th><th>Frequency</th><th>Priority</th><th>Due</th><th>Weight</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>{tasks.map((t,i)=><tr key={t.TaskID||i}><td><b>{t.Task}</b></td><td>{t.EmployeeName||t.EmployeeID}</td><td>{t.Category}</td><td>{t.Frequency}</td><td><span className={"priority "+String(t.Priority).toLowerCase()}>{t.Priority}</span></td><td>{t.DueDate||"-"}</td><td>{t.Weightage||0}</td><td><span className={"badge "+String(t.Status).toLowerCase()}>{t.Status}</span></td>
    <td>{t.Status==="Pending"||t.Status==="Incomplete" ? <button className="small success" onClick={()=>updateTask(t.TaskID,"Complete")}>Complete</button> : null}
    {t.Status==="Complete" && ["HOD","Admin","Management"].includes(user.role) ? <button className="small dark" onClick={()=>updateTask(t.TaskID,"Closed")}>Close</button> : null}</td>
    </tr>)}</tbody></table></div>
  </div>;
}

function AttendanceTable({data}) {
  return <div className="panel"><h3>Attendance</h3><div className="tableWrap"><table><thead><tr><th>Date</th><th>Employee</th><th>Office</th><th>Login</th><th>Logout</th><th>Status</th></tr></thead><tbody>{data.map((a,i)=><tr key={i}><td>{a.Date}</td><td>{a.Name||a.EmployeeID}</td><td>{a.Office}</td><td>{fmt(a.LoginTime)}</td><td>{fmt(a.LogoutTime)}</td><td>{a.Status}</td></tr>)}</tbody></table></div></div>;
}

function EmployeeTable({data}) {
  return <div className="panel"><h3>Employees</h3><div className="tableWrap"><table><thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Office</th><th>Status</th></tr></thead><tbody>{data.map((e,i)=><tr key={i}><td>{e.UserID}</td><td>{e.Name}</td><td>{e.Username}</td><td>{e.Office}</td><td>{e.Status}</td></tr>)}</tbody></table></div></div>;
}

function Assign({employees,onDone}) {
  const [form,setForm]=useState({employeeId:"",task:"",category:"Follow-up Work",frequency:"One Time",priority:"Medium",dueDate:"",weightage:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){e.preventDefault(); const emp=employees.find(x=>String(x.UserID)===String(form.employeeId)); const r=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,employeeName:emp?.Name||""})}); const d=await r.json(); alert(d.message); if(d.ok) onDone();}
  return <div className="panel formPanel"><h3>Assign New Task</h3><form onSubmit={submit} className="formGrid">
    <label>Employee<select value={form.employeeId} onChange={e=>set("employeeId",e.target.value)}><option value="">Select Employee</option>{employees.map(e=><option key={e.UserID} value={e.UserID}>{e.Name} — {e.UserID}</option>)}</select></label>
    <label>Task<input value={form.task} onChange={e=>set("task",e.target.value)} placeholder="Task name / description"/></label>
    <label>Category<select value={form.category} onChange={e=>set("category",e.target.value)}><option>Follow-up Work</option><option>File Work</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Event</option><option>Ad-hoc</option></select></label>
    <label>Frequency<select value={form.frequency} onChange={e=>set("frequency",e.target.value)}><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Event</option><option>One Time</option></select></label>
    <label>Priority<select value={form.priority} onChange={e=>set("priority",e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></label>
    <label>Due Date<input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)}/></label>
    <label>Weightage<input type="number" min="0" max="100" value={form.weightage} onChange={e=>set("weightage",e.target.value)} placeholder="e.g. 5"/></label>
    <div><button className="primary" type="submit">Assign Task</button></div>
  </form></div>;
}