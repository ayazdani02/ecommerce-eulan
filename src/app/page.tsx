import type { Metadata } from "next";
export const metadata: Metadata = { alternates: { canonical: "/" } };
import { Home } from "@/components/Home";
import { RouteReady } from "@/components/RouteReady";
export default function Page() {
  return (
    <>
      <Home />
      <RouteReady />
    </>
  );
}
