"use client";

import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DuplicationDisplayProps {
  isActive: boolean;
  duplicatesRemoved: number;
}

export function DuplicationDisplay({ isActive, duplicatesRemoved }: DuplicationDisplayProps) {
  if (!isActive) return null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Filter
            className={cn(
              "size-5 text-green-600 dark:text-green-500",
              "animate-pulse"
            )}
          />
          <div className="absolute inset-0 animate-ping">
            <Filter className="size-5 text-green-600 dark:text-green-500 opacity-75" />
          </div>
        </div>

        <div className="flex-1">
          <p className="font-medium text-green-900 dark:text-green-100">
            Weeding duplicates
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Analyzing semantic similarity and removing duplicates...
          </p>
        </div>

        {duplicatesRemoved > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
              {duplicatesRemoved}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              removed
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-green-200 dark:bg-green-900">
        <div
          className="h-full bg-green-500 dark:bg-green-600 transition-all duration-500"
          style={{
            width: '100%',
            animation: 'slide 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
