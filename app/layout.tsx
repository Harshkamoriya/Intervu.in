import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { ReactQueryProvider } from "./components/ReactQueryProvider";

export const metadata: Metadata = {
  title: "Interview.ai",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable}`}>
        <body>
          <ReactQueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                className: "font-medium text-sm",
                duration: 4000,
                style: {
                  background: "#333",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                },
              }}
            />
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
