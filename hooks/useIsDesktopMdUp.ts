import { useState, useEffect } from "react";

export function useIsDesktopMdUp() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 768px)");

    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsDesktop(e.matches);

    update(mq);

    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } else {
      // Safari
      // @ts-ignore
      mq.addListener(update);
      // @ts-ignore
      return () => mq.removeListener(update);
    }
  }, []);

  return isDesktop;
}
