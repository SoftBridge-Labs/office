import "./globals.css";
import GlobalLayoutHelper from "./components/GlobalLayoutHelper";

export const metadata = {
  title: "SoftBridge Workspace — Productivity Suite",
  description: "Next-generation office suite: Calendar, Sheets, Docs and more — designed for modern teams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        {children}
        <GlobalLayoutHelper />
      </body>
    </html>
  );
}

