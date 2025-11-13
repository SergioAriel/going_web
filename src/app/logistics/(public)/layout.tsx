import PublicLogisticsHeader from "@/components/layoutLogistics/PublicLogisticsHeader";
import LogisticsFooter from "@/components/layoutLogistics/LogisticsFooter";

export default function PublicLogisticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-grow">
      <PublicLogisticsHeader />
      <main className="flex-grow bg-gray-900">{children}</main>
      <LogisticsFooter />
    </div>
  );
}
