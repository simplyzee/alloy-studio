import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings } = useAppStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure Alloy Studio preferences and validation settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Stability Level */}
          <div className="grid gap-2">
            <Label htmlFor="stability">Stability Level</Label>
            <Select
              value={settings.stabilityLevel}
              onValueChange={(value) =>
                updateSettings({ stabilityLevel: value as any })
              }
            >
              <SelectTrigger id="stability">
                <SelectValue placeholder="Select stability level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
                <SelectItem value="public-preview">Public Preview</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Components with this stability level will be validated and shown in the catalog.
            </p>
          </div>

          {/* Output Format */}
          <div className="grid gap-2">
            <Label htmlFor="format">Output Format</Label>
            <Select
              value={settings.outputFormat}
              onValueChange={(value) =>
                updateSettings({ outputFormat: value as any })
              }
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alloy">Alloy (.alloy)</SelectItem>
                <SelectItem value="yaml">YAML (OTel Collector)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the configuration file format for export.
            </p>
          </div>

          {/* Auto Format on Save */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="autoformat">Auto-format on Save</Label>
              <p className="text-xs text-muted-foreground">
                Automatically format configuration when downloading
              </p>
            </div>
            <Switch
              id="autoformat"
              checked={settings.autoFormatOnSave}
              onCheckedChange={(checked) =>
                updateSettings({ autoFormatOnSave: checked })
              }
            />
          </div>

          {/* Show Pipeline Visualization */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="pipeline">Show Pipeline Visualization</Label>
              <p className="text-xs text-muted-foreground">
                Display visual graph of component connections (coming soon)
              </p>
            </div>
            <Switch
              id="pipeline"
              checked={settings.showPipelineVisualization}
              onCheckedChange={(checked) =>
                updateSettings({ showPipelineVisualization: checked })
              }
            />
          </div>

          {/* Theme */}
          <div className="grid gap-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) =>
                updateSettings({ theme: value as any })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
