"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { DepartmentProgress } from "./types";

interface StatusIndicatorProps {
  currentDepartment: string | null;
  isDeduplicating: boolean;
  model: string;
  qualityThreshold: number;
}

export function StatusIndicator({
  currentDepartment,
  isDeduplicating,
  model,
  qualityThreshold,
}: StatusIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="font-medium">
            {isDeduplicating ? "Weeding duplicates..." : `Processing: ${currentDepartment}`}
          </span>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className="text-xs font-mono">{model}</span>
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Quality Threshold:</span>
        <Badge variant="secondary">{qualityThreshold}%</Badge>
      </div>
    </div>
  );
}

interface DepartmentStatusProps {
  department: DepartmentProgress;
}

export function DepartmentStatus({ department }: DepartmentStatusProps) {
  const getIcon = () => {
    switch (department.status) {
      case 'completed':
        return <CheckCircle2 className="size-4 text-green-500" />;
      case 'running':
        return <Loader2 className="size-4 animate-spin text-primary" />;
      case 'failed':
        return <XCircle className="size-4 text-destructive" />;
      default:
        return <Circle className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium">{department.name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{department.items} items</span>
        {department.duplicatesRemoved > 0 && (
          <span className="text-green-600">-{department.duplicatesRemoved} dupes</span>
        )}
        {department.qualityScore > 0 && (
          <Badge variant="secondary" className="text-xs">
            {department.qualityScore}%
          </Badge>
        )}
      </div>
    </div>
  );
}
