import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/unban" },
};

export default function UnbanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
