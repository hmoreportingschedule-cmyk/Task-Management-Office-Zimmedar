import { NextResponse } from "next/server";
import { appendSheetRow, findRowByValue, updateSheetCell } from "../../../lib/sheets";

function getUser(request) {
  const c = request.cookies.get("office_user")?.value;
  if (!c) return null;
  try { return JSON.parse(Buffer.from(c, "base64url").toString()); } catch { return null; }
}

export async function POST(request) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ ok: false, message: "Session expired." }, { status: 401 });

    const { action, status = "Present", remark = "" } = await request.json();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);

    if (action === "login") {
      const id = "ATT-" + Date.now();
      await appendSheetRow("Attendance", [
        id, user.userId, user.name, user.office, date,
        now.toISOString(), "", status, remark
      ]);
      return NextResponse.json({ ok: true, message: "Attendance marked." });
    }

    if (action === "logout") {
      const found = await findRowByValue("Attendance", "EmployeeID", user.userId, "Date", date);
      if (!found) return NextResponse.json({ ok: false, message: "Aaj ki attendance nahi mili." }, { status: 404 });
      await updateSheetCell("Attendance", found.rowNumber, "LogoutTime", now.toISOString());
      return NextResponse.json({ ok: true, message: "Logout time saved." });
    }

    return NextResponse.json({ ok: false, message: "Invalid action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message || "Attendance error." }, { status: 500 });
  }
}