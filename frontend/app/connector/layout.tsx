import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/connector" },
};

export default function ConnectorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
