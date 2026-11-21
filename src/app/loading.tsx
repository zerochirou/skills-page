import LatticeLoader from "@/components/lattice-loader";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-16">
      <LatticeLoader
        label="Loading"
        color="#f54e00"
        pattern="spiral"
        grid={4}
        cellSize={6}
        gap={3}
      />
    </div>
  );
}
