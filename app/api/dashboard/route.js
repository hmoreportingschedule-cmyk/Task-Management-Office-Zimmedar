import { NextResponse } from "next/server";
import { getSheetRows } from "../../../lib/sheets";

function getUser(request) {
  const c = request.cookies.get("office_user")?.value;
  if (!c) return null;
  try { return JSON.parse(Buffer.from(c, "base64url").toString()); } catch { return null; }
}

function objects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(x => String(x).trim());
  return rows.slice(1).filter(r => r.some(x => x !== "")).map(r => {
    const o = {};
    headers.forEach((h, i) => o[h] = r[i] ?? "");
    return o;
  });
}

function taskScope(tasks, user) {
  if (user.role === "Admin" || user.role === "Management") return tasks;
  if (user.role === "HOD") return tasks.filter(t => String(t.Office) === String(user.office));
  return tasks.filter(t => String(t.EmployeeID) === String(user.userId));
}

function attendanceScope(att, user) {
  if (user.role === "Admin" || user.role === "Management") return att;
  if (user.role === "HOD") return att.filter(a => String(a.Office) === String(user.office));
  return att.filter(a => String(a.EmployeeID) === String(user.userId));
}

export async function GET(request) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ ok: false, message: "Session expired." }, { status: 401 });

    const [taskRows, attRows, userRows] = await Promise.all([
      getSheetRows("Tasks"),
      getSheetRows("Attendance"),
      getSheetRows("Users")
    ]);

    const tasks = taskScope(objects(taskRows), user);
    const attendance = attendanceScope(objects(attRows), user);
    const employees = objects(userRows).filter(u => {
      if (u.Role !== "Employee") return false;
      if (user.role === "Admin" || user.role === "Management") return true;
      return String(u.Office) === String(user.office);
    });

    const total = tasks.length;
    const complete = tasks.filter(t => ["Complete", "Closed"].includes(String(t.Status))).length;
    const pending = tasks.filter(t => String(t.Status) === "Pending").length;
    const incomplete = tasks.filter(t => String(t.Status) === "Incomplete").length;
    const closed = tasks.filter(t => String(t.Status) === "Closed").length;
    const delayed = tasks.filter(t => Number(t.DelayDays || 0) > 0 || String(t.Status) === "Delayed").length;
    const percentage = total ? Math.round((complete / total) * 100) : 0;
    const weightage = tasks.reduce((s, t) => s + Number(t.Weightage || 0), 0);

    return NextResponse.json({
      ok: true,
      user,
      employees,
      tasks: tasks.slice().reverse().slice(0, 500),
      attendance: attendance.slice().reverse().slice(0, 100),
      summary: { total, complete, pending, incomplete, closed, delayed, percentage, weightage }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message || "Dashboard error." }, { status: 500 });
  }
}