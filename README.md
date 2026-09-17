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


Distributed employee storage: the Users sheet remains the master login/assignment sheet. Each employee is assigned an individual Google Spreadsheet automatically on first system use; Tasks, Attendance and WorkLogs are stored in that employee file. HOD/Admin dashboards aggregate only authorized employee files. Users sheet receives Employee Data Spreadsheet ID and Employee Data Spreadsheet URL columns automatically.
