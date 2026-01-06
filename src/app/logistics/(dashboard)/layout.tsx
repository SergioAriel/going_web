import DashboardHeader from "@/components/layoutLogistics/DashboardHeader";
import DashboardSidebar from "@/components/layoutLogistics/DashboardSidebar";
import { SocketProvider } from "@/context/SocketContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-gray-900">
        <DashboardHeader />
        <div className="flex flex-row flex-1 overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto bg-gray-900 p-0">
            {children}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}