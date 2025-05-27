import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";
import { ChatProvider } from "@/context/ChatProvider";
import { Analytics } from "@vercel/analytics/react";
import LiveChatBubble from "@/components/chat/LiveChatBubble"; // Import the new component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whispr - Temporary Chat App",
  description: "A modern temporary chat application where conversations are deleted when the session ends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ChatProvider>
            {children}
            <LiveChatBubble /> {/* Add the LiveChatBubble component here */}
          </ChatProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
