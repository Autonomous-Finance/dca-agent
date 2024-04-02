import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { hashString } from "./data-utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getColorFromText(text: string) {
  const colors: Record<string, string> = {
    red: "bg-red-300",
    blue: "bg-blue-300",
    green: "bg-green-300",
    lime: "bg-lime-300",
    yellow: "bg-yellow-300",
    purple: "bg-purple-300",
    indigo: "bg-indigo-300",
    cyan: "bg-cyan-300",
    pink: "bg-pink-300",
  }

  const colorKeys = Object.keys(colors)
  const hash = hashString(text)
  const colorIndex = Math.abs(hash) % colorKeys.length
  return colors[colorKeys[colorIndex]]
}
