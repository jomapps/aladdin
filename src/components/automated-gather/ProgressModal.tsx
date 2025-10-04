"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { StatusIndicator, DepartmentStatus } from "./StatusIndicator";
import { DuplicationDisplay } from "./DuplicationDisplay";
import type { AutomatedGatherProgress } from "./types";

interface ProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}

export function ProgressModal({ open, onOpenChange, onCancel }: ProgressModalProps) {
  const [progress, setProgress] = useState<AutomatedGatherProgress | null>(null);

  useEffect(() => {
    if (!open) return;

    // WebSocket connection for real-time updates
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/automated-gather/progress`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as AutomatedGatherProgress;
      setProgress(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [open]);

  const handleCancel = async () => {
    if (!progress || progress.status === 'completed' || progress.status === 'cancelled') {
      return;
    }

    try {
      await fetch('/api/automated-gather/cancel', { method: 'POST' });
      onCancel?.();
    } catch (error) {
      console.error('Error cancelling automation:', error);
    }
  };

  const qualityProgress = progress
    ? (progress.qualityScore / progress.targetQualityScore) * 100
    : 0;

  const canCancel = progress?.status === 'running';
  const isComplete = progress?.status === 'completed';
  const isFailed = progress?.status === 'failed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" showCloseButton={!canCancel}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete && <CheckCircle2 className="size-5 text-green-500" />}
            {isFailed && <XCircle className="size-5 text-destructive" />}
            <span>
              {isComplete
                ? "Automated Gather Complete"
                : isFailed
                ? "Automated Gather Failed"
                : "Automated Gather in Progress"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? "Successfully processed all departments and removed duplicates"
              : isFailed
              ? "An error occurred during the automated gather process"
              : "AI is processing departments and removing duplicates"}
          </DialogDescription>
        </DialogHeader>

        {progress && (
          <div className="space-y-6">
            {/* Current Status */}
            {!isComplete && !isFailed && (
              <StatusIndicator
                currentDepartment={progress.currentDepartment}
                isDeduplicating={progress.isDeduplicating}
                model={progress.model}
                qualityThreshold={progress.targetQualityScore}
              />
            )}

            {/* Deduplication Display */}
            <DuplicationDisplay
              isActive={progress.isDeduplicating}
              duplicatesRemoved={progress.duplicatesRemoved}
            />

            {/* Quality Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Quality Score</span>
                <span className="text-muted-foreground">
                  {progress.qualityScore}% / {progress.targetQualityScore}%
                </span>
              </div>
              <Progress value={qualityProgress} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {progress.currentIteration}/{progress.maxIterations}
                    </p>
                    <p className="text-sm text-muted-foreground">Iterations</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                      {progress.duplicatesRemoved}
                    </p>
                    <p className="text-sm text-muted-foreground">Duplicates Removed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{progress.totalItems}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Progress List */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Department Progress</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="divide-y">
                    {progress.departments.map((dept) => (
                      <DepartmentStatus key={dept.name} department={dept} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Message */}
            {isFailed && progress.error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{progress.error}</p>
                </CardContent>
              </Card>
            )}

            {/* Completion Message */}
            {isComplete && (
              <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    All departments have been processed successfully. {progress.duplicatesRemoved}{" "}
                    duplicates were removed, resulting in {progress.totalItems} unique items with a
                    quality score of {progress.qualityScore}%.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {canCancel && (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel Process
                </Button>
              )}
              {(isComplete || isFailed) && (
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
