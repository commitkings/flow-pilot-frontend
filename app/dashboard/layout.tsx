import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
