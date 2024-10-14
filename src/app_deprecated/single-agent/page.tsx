'use client'

import { Suspense } from "react";
import SingleAgent from "./SingleAgent";

export default function SingleAgentPage() {
  return (
    <Suspense>
      <SingleAgent />
    </Suspense>
  )
}