"use client";
import { ReactNode } from "react";
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
