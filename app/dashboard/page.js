import { NextResponse } from "next/server";
import { getSheetRows } from "../../../../lib/sheets";

function getUser(request) {
  const c = request.cookies.get("office_user")?.value;

  if (!c) return null;

  try {
    return JSON.parse(
      Buffer.from(c, "base64url").toString()
    );
  } catch {
    return null;
  }
}

function objects(rows) {

  if (!rows.length) return [];

  const headers = rows[0].map(x =>
    String(x).trim()
  );

  return rows
    .slice(1)
    .filter(r => r.some(x => x !== ""))
    .map(r => {

      const obj = {};

      headers.forEach((h, i) => {
        obj[h] = r[i] ?? "";
      });

      return obj;

    });
}


function taskScope(tasks, user) {

  if (
    user.role === "Admin" ||
    user.role === "Management"
  ) {
    return tasks;
  }

  if (user.role === "HOD") {

    return tasks.filter(
      t =>
        String(t.Office) ===
        String(user.office)
    );

  }

  return tasks.filter(
    t =>
      String(t.EmployeeID) ===
      String(user.userId)
  );
}


function attendanceScope(attendance, user) {

  if (
    user.role === "Admin" ||
    user.role === "Management"
  ) {
    return attendance;
  }

  if (user.role === "HOD") {

    return attendance.filter(
      a =>
        String(a.Office) ===
        String(user.office)
    );

  }

  return attendance.filter(
    a =>
      String(a.EmployeeID) ===
      String(user.userId)
  );
}


export async function GET(request) {

  try {

    const user = getUser(request);

    if (!user) {

      return NextResponse.json(
        {
          ok: false,
          message: "Session expired."
        },
        { status: 401 }
      );

    }


    const [
      taskRows,
      attendanceRows,
      userRows
    ] = await Promise.all([

      getSheetRows("Tasks"),

      getSheetRows("Attendance"),

      getSheetRows("Users")

    ]);


    const allTasks =
      objects(taskRows);

    const allAttendance =
      objects(attendanceRows);

    const allUsers =
      objects(userRows);


    const tasks =
      taskScope(
        allTasks,
        user
      );


    const attendance =
      attendanceScope(
        allAttendance,
        user
      );


    const employees =
      allUsers.filter(employee => {

        if (
          employee.Role !==
          "Employee"
        ) {
          return false;
        }


        if (
          user.role === "Admin" ||
          user.role === "Management"
        ) {
          return true;
        }


        return (
          String(employee.Office) ===
          String(user.office)
        );

      });


    const total =
      tasks.length;


    const complete =
      tasks.filter(task =>
        [
          "Complete",
          "Closed"
        ].includes(
          String(task.Status)
        )
      ).length;


    const pending =
      tasks.filter(task =>
        String(task.Status) ===
        "Pending"
      ).length;


    const incomplete =
      tasks.filter(task =>
        String(task.Status) ===
        "Incomplete"
      ).length;


    const closed =
      tasks.filter(task =>
        String(task.Status) ===
        "Closed"
      ).length;


    const delayed =
      tasks.filter(task =>
        Number(task.DelayDays || 0) > 0 ||
        String(task.Status) === "Delayed"
      ).length;


    const percentage =
      total > 0
        ? Math.round(
            (complete / total) * 100
          )
        : 0;


    const weightage =
      tasks.reduce(
        (sum, task) =>
          sum +
          Number(
            task.Weightage || 0
          ),
        0
      );


    return NextResponse.json({

      ok: true,

      user,

      employees,

      tasks:
        tasks
          .slice()
          .reverse()
          .slice(0, 500),

      attendance:
        attendance
          .slice()
          .reverse()
          .slice(0, 100),

      summary: {

        total,

        complete,

        pending,

        incomplete,

        closed,

        delayed,

        percentage,

        weightage

      }

    });

  } catch (error) {

    return NextResponse.json(

      {
        ok: false,
        message:
          error.message ||
          "Dashboard error."
      },

      { status: 500 }

    );

  }

}
