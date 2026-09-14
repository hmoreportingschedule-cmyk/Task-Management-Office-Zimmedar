"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch("/api/auth/login", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username, password })
    });
    const data = await r.json();
    setLoading(false);
    if (!data.ok) return setError(data.message);
    router.push("/dashboard");
  }

  return (
    <main className="loginPage">
      <div className="loginCard">
        <div className="brandIcon">OW</div>
        <h1>Office Work</h1>
        <p className="muted">Attendance • Task • KPI Management</p>
        <form onSubmit={submit}>
          <label>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" />
          <label>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" />
          {error && <div className="error">{error}</div>}
          <button className="primary wide" disabled={loading}>{loading ? "Signing in..." : "LOGIN"}</button>
        </form>
        <div className="loginFooter">Secure Office Management System</div>
      </div>
    </main>
  );
}