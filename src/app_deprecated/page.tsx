import { Suspense } from "react";
import Home from "./Home";

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}
