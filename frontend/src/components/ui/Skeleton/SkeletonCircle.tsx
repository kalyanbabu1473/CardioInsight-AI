import Skeleton from "./Skeleton";

export interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export default function SkeletonCircle({ size = 48, className }: SkeletonCircleProps) {
  return <Skeleton circle width={size} height={size} className={className} />;
}