import { Stack, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

import { TYPE_COLOR_MAP, TYPE_ICON_MAP } from "@/utils/data-utils"

import { MonoFontFF } from "./RootLayout/fonts"

type TypeBadgeProps = {
  type: string
}

export function TypeBadge(props: TypeBadgeProps) {
  const { type } = props

  return (
    <>
      <Stack
        direction="row"
        gap={1}
        className={`flex min-w-[70px] py-1 px-2 space-x-1 items-center ${TYPE_COLOR_MAP[type]}`}
      >
        <Typography
          textTransform="uppercase"
          variant="body2"
          fontFamily={MonoFontFF}
          sx={{ color: "black" }}
        >
          {type}
        </Typography>
        {TYPE_ICON_MAP[type] && (
          <Image alt="icon" width={8} height={8} src={TYPE_ICON_MAP[type]} />
        )}
      </Stack>
    </>
  )
}
