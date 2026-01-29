import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  resultCount?: number;
  resultLabel?: string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  resultCount,
  resultLabel = "results",
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 pl-2 pr-1 py-1"
        >
          <span className="text-xs text-muted-foreground mr-1">{filter.label}:</span>
          <span>{filter.displayValue}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs h-7"
        >
          Clear all
        </Button>
      )}
      {resultCount !== undefined && (
        <span className="ml-auto text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? resultLabel.replace(/s$/, '') : resultLabel}
        </span>
      )}
    </div>
  );
}
