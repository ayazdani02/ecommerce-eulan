"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RouteReady() {
  const pathname = usePathname();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("eulan:route-ready", { detail: pathname }),
    );
  }, [pathname]);

  return null;
}
