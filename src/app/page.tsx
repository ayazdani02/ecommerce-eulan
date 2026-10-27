import type { Metadata } from "next";
export const metadata: Metadata = { alternates: { canonical: "/" } };
import { Home } from "@/components/Home";
export default function Page() {
  return <Home />;
}
