import Image from "next/image";
import type { CourierId } from "@/integrations/envia/delivery-estimate";

const COURIER_LOGOS: Record<CourierId, { src: string; alt: string; width: number; height: number }> = {
  blueexpress: { src: "/couriers/blue-express.png", alt: "Blue Express", width: 600, height: 400 },
  starken: { src: "/couriers/starken.jpg", alt: "Starken", width: 1024, height: 507 },
  chilexpress: { src: "/couriers/chilexpress.png", alt: "Chilexpress", width: 4680, height: 876 },
};

export function CourierLogo({ courier }: { courier: CourierId }) {
  const logo = COURIER_LOGOS[courier];
  return (
    <span className={`courier-logo courier-logo-${courier}`}>
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        sizes="112px"
      />
    </span>
  );
}
