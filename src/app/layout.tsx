import type { Metadata } from "next"

import RootLayoutUI from "../components/RootLayout/RootLayoutUI"

export const metadata: Metadata = {
  title: "AF DCA Bot",
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
        <RootLayoutUI>{children}</RootLayoutUI>
      </body>
    </html>
  )
}
