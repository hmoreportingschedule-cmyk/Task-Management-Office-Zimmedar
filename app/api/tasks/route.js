import { NextResponse } from "next/server";
import { appendSheetRow, findRowByValue, updateSheetValues } from "../../../lib/sheets";

function getUser(request) {
  const c = request.cookies.get("office_user")?.value;
  if (!c) return null;
  try { return JSON.parse(Buffer.from(c, "base64url").toString()); } catch { return null; }
}

export async function POST(request) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ ok: false, message: "Session expired." }, { status: 401 });
    if (!["HOD", "Admin", "Management"].includes(user.role)) {
      return NextResponse.json({ ok: false, message: "Sirf HOD/Admin task assign kar sakte hain." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.employeeId || !body.task) {
      return NextResponse.json({ ok: false, message: "Employee aur task required hai." }, { status: 400 });
    }

    const id = "TASK-" + Date.now();
    await appendSheetRow("Tasks", [
      id, body.employeeId, body.employeeName || "", user.office || "",
      body.task, body.category || "Ad-hoc", body.frequency || "One Time",
      body.priority || "Medium", new Date().toISOString().slice(0,10),
      body.dueDate || "", Number(body.weightage || 0), "Pending", "", "", 0, ""
    ]);

    return NextResponse.json({ ok: true, message: "Task successfully assigned." });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message || "Task assignment error." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ ok: false, message: "Session expired." }, { status: 401 });

    const { taskId, status, closingRemark = "" } = await request.json();
    const found = await findRowByValue("Tasks", "TaskID", taskId);
    if (!found) return NextResponse.json({ ok: false, message: "Task not found." }, { status: 404 });

    const task = found.object;
    if (user.role === "Employee" && String(task.EmployeeID) !== String(user.userId)) {
      return NextResponse.json({ ok: false, message: "Permission denied." }, { status: 403 });
    }
    if (status === "Closed" && !["HOD", "Admin", "Management"].includes(user.role)) {
      return NextResponse.json({ ok: false, message: "Task closing HOD/Admin karega." }, { status: 403 });
    }

    const values = {
      Status: status,
      ClosingDate: ["Complete", "Closed"].includes(status) ? new Date().toISOString() : task.ClosingDate || "",
      ClosingRemark: closingRemark
    };

    await updateSheetValues("Tasks", found.rowNumber, values);
    return NextResponse.json({ ok: true, message: "Task updated." });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message || "Task update error." }, { status: 500 });
  }
}