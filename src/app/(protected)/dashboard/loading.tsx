import LatticeLoader from "@/components/lattice-loader";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center px-4">
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
