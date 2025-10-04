"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface AutomatedGatherButtonProps {
  projectId: string;
  gatherCount: number;
  onStart?: () => void;
}

export function AutomatedGatherButton({ projectId, gatherCount, onStart }: AutomatedGatherButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isDisabled = gatherCount < 1;

  const handleClick = async () => {
    if (isDisabled || isLoading) return;

    setIsLoading(true);

    try {
      // Call the API to start automation
      const response = await fetch(`/api/v1/automated-gather/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start automation');
      }

      const data = await response.json();

      // Notify parent component
      onStart?.();

      // Show success toast
      toast.success('Automated gather started successfully');

      // Redirect to project-readiness page with project ID
      router.push(`/dashboard/project/${projectId}/project-readiness`);
    } catch (error) {
      console.error('Error starting automation:', error);
      toast.error('Failed to start automated gather');
      setIsLoading(false);
    }
  };

  const tooltipContent = isDisabled
    ? "You need at least 1 gather to use automated gather"
    : "Start automated gather process with AI-powered deduplication";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          disabled={isDisabled || isLoading}
          size="lg"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Starting...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              <span>Automated Gather</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
