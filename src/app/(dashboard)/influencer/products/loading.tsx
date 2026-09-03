import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/shared/PageSkeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
