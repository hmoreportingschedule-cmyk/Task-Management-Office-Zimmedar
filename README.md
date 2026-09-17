# Office Work Management - Vercel + Google Sheets

## 1. Install
npm install

## 2. Create Google Sheet
Create the sheets and columns listed in GOOGLE-SHEET-STRUCTURE.txt.

## 3. Google service account
Create a Google Cloud service account, enable Google Sheets API, create a JSON key, and share your spreadsheet with the service-account email as Editor.

## 4. Environment variables
Add these to Vercel Project Settings -> Environment Variables:
GOOGLE_SHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY

For GOOGLE_PRIVATE_KEY, paste the complete private key. In Vercel it is normally stored with \n line breaks.

## 5. Password
Run:
npm run hash-password -- MyStrongPassword

Put the generated value in Users -> PasswordHash.

## 6. Deploy
Push this project to GitHub and import it into Vercel, or deploy with Vercel CLI.

The app has:
- Attractive login
- Employee/HOD/Admin/Management role handling
- Attendance
- Task assignment
- Daily/Weekly/Monthly/Event/Ad-hoc tasks
- Priority
- Pending/Complete/Incomplete/Closed
- Weightage
- Performance %
- HOD employee view
- Management-wide view

For production, add rate limiting, audit logs, password reset and stricter server-side authorization before using with sensitive company data.


## Employee-wise Data Storage
The updated backend keeps `Users` as the master login/assignment sheet and creates a separate Google Spreadsheet for each employee on first login. Each employee file contains `Tasks`, `Attendance`, and `WorkLogs`. The `Users` sheet automatically gets/uses `Data Spreadsheet ID` and `Data Spreadsheet URL` columns. Existing employee rows from the master `Tasks`, `Attendance`, and `WorkLogs` sheets are migrated once when that employee storage file is first created.

## Dashboard Reports
The dashboard header now provides three report buttons: `Attendance Report`, `Task Report`, and `Progress Chart`. Task reports show on-time/early, delayed, pending and delay days. Progress Chart supports Attendance/Task weightage totaling 100% and displays Daily, Weekly and Monthly grades: A (Mumtaz), B (Behtar), C (Munasib), D (Kamzor).

## Deployment
1. Update `backend_code.js` in the Google Apps Script project bound to the master Users spreadsheet.
2. Deploy the Apps Script as a Web App and use its `/exec` URL in `index.html`.
3. Deploy `index.html` to Vercel.
4. The first employee login will ask Google Apps Script for spreadsheet/Drive authorization if required.
