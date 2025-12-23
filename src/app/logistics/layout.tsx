// This is the root layout for the /logistics section.
// It ensures the entire section grows to fill the available space.
// The actual layouts with headers and footers are provided by the route groups within this section.
export default function RootLogisticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-grow">
      {children}
    </div>
  );
}