import DashboardHeader from "@/components/layoutLogistics/DashboardHeader";
import DashboardSidebar from "@/components/layoutLogistics/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-grow h-screen overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-row flex-grow overflow-hidden">
        <DashboardSidebar />
        <main className="flex-grow bg-gray-900 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}