import "./globals.css";

export const metadata = {
  title: "Office Work Management",
  description: "Attendance, Task & KPI Dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}