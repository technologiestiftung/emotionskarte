import clsx from "clsx";
import { icons, type IconName } from "../icons";

type Props = {
  name: IconName;
  className?: string;
  raw?: boolean; // <-- NEW
};

export default function Icon({ name, className, raw }: Props) {
  const rawIcon = icons[name] as any;
  const src: string = typeof rawIcon === "string" ? rawIcon : rawIcon?.src;

  // Option 1: show RAW image (original colors)
  if (raw) {
    return (
      <img
        src={src}
        className={clsx("inline-block align-middle", className)}
        alt={name}
      />
    );
  }

  // Option 2: masked monochrome version (old behavior)
  return (
    <span
      className={clsx("inline-block align-middle", className)}
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
