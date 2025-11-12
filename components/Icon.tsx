// components/Icon.tsx
import clsx from "clsx";
import { icons, type IconName } from "../icons";

type Props = {
  name: IconName;
  className?: string; // use Tailwind: e.g. "w-5 h-5 text-white"
};

export default function Icon({ name, className }: Props) {
  // Next static import is either a string or an object with .src
  const raw = icons[name] as any;
  const src: string = typeof raw === "string" ? raw : raw?.src;

  return (
    <span
      className={clsx("inline-block align-middle", className)}
      // Mask paints the icon with backgroundColor; we set it to currentColor,
      // so Tailwind's `text-white` / `text-black` controls the icon color.
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        backgroundColor: "currentColor",
      }}
      aria-hidden
    />
  );
}
