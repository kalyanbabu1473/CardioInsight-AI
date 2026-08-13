import Skeleton from "./Skeleton";

export interface SkeletonTextProps {
  lines?: number;
  widths?: Array<number | string>;
  className?: string;
}

export default function SkeletonText({
  lines = 3,
  widths = ["100%", "92%", "60%"],
  className,
}: SkeletonTextProps) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={widths[i] ?? widths[widths.length - 1]}
          height={12}
          radius={6}
        />
      ))}
    </div>
  );
}