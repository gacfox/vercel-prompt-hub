import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <Sidebar />
      </Suspense>
      <div className="flex-1 overflow-auto">{children}</div>
    </>
  );
}
