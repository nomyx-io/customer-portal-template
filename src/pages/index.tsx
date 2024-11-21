import React, { useEffect } from "react";

import { useRouter } from "next/router";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div
      className="w-[100%] h-[100%] overflow-hidden absolute top-0 left-0 flex justify-center items-center z-20"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
    >
    </div>
  );
}
