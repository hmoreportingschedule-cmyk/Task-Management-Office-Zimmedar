import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSheetRows } from "../../../../lib/sheets";

function verifyPassword(password, stored) {
  if (!stored) return false;
  // Format: scrypt$base64Salt$base64Hash
  const parts = String(stored).split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, expected);
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ ok: false, message: "Username aur password required hai." }, { status: 400 });
    }

    const rows = await getSheetRows("Users");
    if (!rows.length) {
      return NextResponse.json({ ok: false, message: "Users sheet mein data nahi mila." }, { status: 500 });
    }

    const headers = rows[0];
    const idx = Object.fromEntries(headers.map((h, i) => [String(h).trim(), i]));
    const user = rows.slice(1).find(r =>
      String(r[idx.Username] ?? "").trim().toLowerCase() === String(username).trim().toLowerCase()
    );

    if (!user) return NextResponse.json({ ok: false, message: "Username ya password galat hai." }, { status: 401 });
    if (String(user[idx.Status] ?? "Active").toLowerCase() !== "active") {
      return NextResponse.json({ ok: false, message: "User inactive hai." }, { status: 403 });
    }

    const valid = verifyPassword(password, user[idx.PasswordHash]);
    if (!valid) return NextResponse.json({ ok: false, message: "Username ya password galat hai." }, { status: 401 });

    const profile = {
      userId: user[idx.UserID],
      name: user[idx.Name],
      username: user[idx.Username],
      role: user[idx.Role],
      office: user[idx.Office],
      hodId: user[idx.HODID] || ""
    };

    const response = NextResponse.json({ ok: true, user: profile });
    response.cookies.set("office_user", Buffer.from(JSON.stringify(profile)).toString("base64url"), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/"
    });
    return response;
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message || "Login error." }, { status: 500 });
  }
}