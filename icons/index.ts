// icons/index.ts
import housesURL from "./houses.svg";
import busURL from "./bus.svg";
import leafURL from "./leaf.svg";
import totalURL from "./total.svg";
import emoUrl from "./logoEmo.svg";
import berlinUrl from "./berlin.svg";
import buaUrl from "./bua.svg";
import chariteUrl from "./charite.svg";
import euUrl from "./eu.svg";
import odisUrl from "./odis.svg";
import stiftungUpUrl from "./stiftung_up.svg";
import tsbUrl from "./tsb.svg";
import huUrl from "./tu.svg";
import tuUrl from "./hu.svg";

import emocityURl from "./emocity.svg";

export const icons = {
  total: totalURL,
  drinnen: housesURL,
  oepnv: busURL,
  draussen: leafURL,
  logoEmo: emoUrl,
  berlin: berlinUrl,
  bua: buaUrl,
  charite: chariteUrl,
  eu: euUrl,
  odis: odisUrl,
  stiftungUp: stiftungUpUrl,
  tsb: tsbUrl,
  tu: tuUrl,
  hu: huUrl,
  emocity: emocityURl,
} as const;

export type IconName = keyof typeof icons;
