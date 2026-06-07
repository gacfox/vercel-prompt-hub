import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ContentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />
      </CardContent>
      <CardFooter className="flex items-center justify-between px-4 pb-3 pt-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardFooter>
    </Card>
  );
}
