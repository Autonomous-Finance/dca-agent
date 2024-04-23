import { Suspense } from "react";
import SingleAgent from "./SingleAgentPage";

export default function SingleAgentServer() {
  return (
    <Suspense>
      <SingleAgent />
    </Suspense>
  )
}
