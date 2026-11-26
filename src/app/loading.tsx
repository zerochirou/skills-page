import LatticeLoader from "@/components/lattice-loader";

export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4">
      <LatticeLoader
        label="Loading"
        color="var(--primary)"
        pattern="spiral"
        grid={4}
        cellSize={6}
        gap={3}
      />
    </div>
  );
}
