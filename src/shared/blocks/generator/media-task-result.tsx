/**
 * Media Task Result Component - Not used in dashboard
 * This file exists only to prevent build errors from legacy subtitle extract code
 */

'use client';

interface MediaTaskResultProps {
  mediaTaskId: string;
  taskId: string;
}

export function MediaTaskResult({ mediaTaskId, taskId }: MediaTaskResultProps) {
  return (
    <div className="text-sm text-muted-foreground">
      Media tasks are not available in dashboard.
    </div>
  );
}

