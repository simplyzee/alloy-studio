import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PipelineVisualization } from '../builder/PipelineVisualization';

interface PipelineOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: string;
}

export function PipelineOverlay({ open, onOpenChange, config }: PipelineOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Overlay Content */}
      <div className="relative z-10 w-[90%] max-w-4xl max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Pipeline Visualization</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Pipeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <PipelineVisualization config={config} />
        </div>
      </div>
    </div>
  );
}
