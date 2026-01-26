import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ShopProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-neutral-200">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
