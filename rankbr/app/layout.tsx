import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "RankBR — Diagnóstico de Marketing Digital",
    template: "%s | RankBR",
  },
  description:
    "Diagnóstico completo de marketing digital + plano de ação personalizado com IA para sua empresa por R$10.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/*
         * AuthProvider is a Client Component that manages Supabase auth state.
         * Suspense is required here because login/page uses useSearchParams(),
         * which suspends during static rendering.
         */}
        <AuthProvider>
          <Suspense>{children}</Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
