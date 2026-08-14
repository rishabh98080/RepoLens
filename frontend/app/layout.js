export const metadata = {
  title: "RepoLens — Repository Analysis",
  description: "Enterprise Codebase Risk Intelligence Platform",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
