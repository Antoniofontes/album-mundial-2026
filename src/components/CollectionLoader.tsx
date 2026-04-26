"use client";

import { useEffect } from "react";
import { useCollection } from "@/lib/store";

export function CollectionLoader() {
  const load = useCollection((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);
  return null;
}
