export const truncateId = (text: string) => {
  if (!text || text.length <= 16) return text
  return text.slice(0, 8) + "..." + text.slice(-8)
}

export function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

export const TYPE_ICON_MAP: Record<string, any> = {
  Process: "/process.svg",
  Message: "/message.svg",
  Module: "/article.svg",
}

export const TYPE_COLOR_MAP: Record<string, string> = {
  Module: "bg-[#B8C3E050]",
  Checkpoint: "bg-[#B8C3E050]",
  Process: "bg-[#B8C3E0]",
  Message: "bg-[#E2F0DC]",
  Owner: "bg-[#FFADAD]",
  Block: "bg-[#FEEEE5]",
  Entity: "bg-[#9EA2AA]",
}

export const TYPE_PATH_MAP: Record<string, string> = {
  Module: "module",
  Checkpoint: "message",
  Process: "entity",
  Message: "message",
  Owner: "entity",
  Block: "block",
  Entity: "entity",
}
