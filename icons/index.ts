// icons/index.ts
import housesURL from "./houses.svg";
import busURL from "./bus.svg";
import leafURL from "./leaf.svg";
import totalURL from "./total.svg";
import logoEmoUrl from "./logoEmo.svg";

export const icons = {
  total: totalURL,
  drinnen: housesURL,
  oepnv: busURL,
  draussen: leafURL,
  logoEmo: logoEmoUrl,
} as const;

export type IconName = keyof typeof icons;
