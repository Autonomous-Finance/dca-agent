import type { Metadata } from "next"

import RootLayoutUI from "../components/RootLayout/RootLayoutUI"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "AF DCA Agent",
  icons: {
    icon: "/ao.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {/* For pages that need `useSearchParams` */}
        <Suspense>
          <RootLayoutUI>{children}</RootLayoutUI>
        </Suspense>
      </body>
    </html>
  )
}
