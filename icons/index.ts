// icons/index.ts
import housesURL from "./houses.svg";
import busURL from "./bus.svg";
import leafURL from "./leaf.svg";

export const icons = {
  drinnen: housesURL,
  oepnv: busURL,
  draussen: leafURL,
} as const;

export type IconName = keyof typeof icons;
