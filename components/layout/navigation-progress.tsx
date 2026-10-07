"use client";

import { AppProgressProvider } from "@bprogress/next";

export function NavigationProgress({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProgressProvider
      color="var(--primary)"
      height="3px"
      options={{ showSpinner: false }}
      delay={150}
      stopDelay={300}
      shallowRouting={false}
    >
      {children}
    </AppProgressProvider>
  );
}
