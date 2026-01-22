import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BlogPostCardSkeleton() {
  return (
    <Card className="bg-card border-border hover:shadow-lg transition-shadow h-full flex flex-col">
      <Skeleton className="aspect-video w-full rounded-t-lg" />
      <CardHeader>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}
