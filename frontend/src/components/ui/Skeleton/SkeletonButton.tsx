import Skeleton from "./Skeleton";

export interface SkeletonButtonProps {
  width?: number | string;
  height?: number;
  radius?: string;
  className?: string;
}

export default function SkeletonButton({
  width = 120,
  height = 44,
  radius,
  className,
}: SkeletonButtonProps) {
  return <Skeleton width={width} height={height} radius={radius} className={className} />;
}