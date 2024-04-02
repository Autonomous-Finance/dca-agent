import { DM_Sans, Space_Mono } from "next/font/google"

const SpaceMono = Space_Mono({
  display: "block",
  weight: ["400", "700"],
  subsets: ["latin"],
})

const DmSans = DM_Sans({
  display: "block",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
})

export const MainFontFF = DmSans.style.fontFamily
export const MonoFontFF = SpaceMono.style.fontFamily
export const TitleFontFF = SpaceMono.style.fontFamily
