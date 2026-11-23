import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { CRMProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dummy CRM Portal",
  description: "A demo CRM portal for learning and demonstrating CRM functionality. All data is fictional.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <CRMProvider>
          <AppShell>{children}</AppShell>
        </CRMProvider>
      </body>
    </html>
  );
}
