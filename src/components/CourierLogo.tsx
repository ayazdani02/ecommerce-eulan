import Image from "next/image";
import type { CourierId } from "@/integrations/envia/delivery-estimate";

const COURIER_LOGOS: Partial<Record<CourierId, { src: string; alt: string; width: number; height: number }>> = {
  blueexpress: { src: "/couriers/blue-express.png", alt: "Blue Express", width: 600, height: 400 },
  starken: { src: "/couriers/starken.jpg", alt: "Starken", width: 1024, height: 507 },
  chilexpress: { src: "/couriers/chilexpress.png", alt: "Chilexpress", width: 4680, height: 876 },
  correoschile: { src: "/couriers/correoschile.svg", alt: "CorreosChile", width: 215, height: 30 },
};

export function CourierLogo({ courier, name }: { courier: CourierId; name?: string }) {
  const logo = COURIER_LOGOS[courier];
  return (
    <span
      className={`courier-logo courier-logo-${courier}${logo ? "" : " courier-logo-fallback"}`}
      aria-label={logo?.alt ?? name ?? courier}
      title={logo?.alt ?? name ?? courier}
    >
      {logo ? (
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          sizes="112px"
        />
      ) : (
        name ?? courier
      )}
    </span>
  );
}
