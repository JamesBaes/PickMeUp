"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const SelectLocation = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="font-body text-gray-600">Redirecting to menu...</p>
    </div>
  );
};

export default SelectLocation;