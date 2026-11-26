import LatticeLoader from "@/components/lattice-loader";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-16">
      <LatticeLoader
        label="Loading workspace"
        color="var(--primary)"
        pattern="spiral"
        grid={4}
        cellSize={6}
        gap={3}
      />
    </div>
  );
}
