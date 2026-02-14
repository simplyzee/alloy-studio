import { Button } from '@/components/ui/button';
import { Download, FileCode, CheckCircle, Settings, Workflow } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useState } from 'react';
import { SettingsDialog } from './SettingsDialog';
import { PipelineOverlay } from './PipelineOverlay';

export function Toolbar() {
  const { currentConfig, setConfig, setMode, settings } = useAppStore();
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);

  const handleFormat = async () => {
    try {
      const result = await api.formatConfig(currentConfig);
      setConfig(result.formatted_config);
      setValidationMessage('Formatted successfully');
      setTimeout(() => setValidationMessage(null), 3000);
    } catch (error) {
      setValidationMessage('Format failed');
      setTimeout(() => setValidationMessage(null), 3000);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await api.validateConfig(
        currentConfig,
        settings.stabilityLevel,
        settings.enableCommunityComponents
      );
      if (result.valid) {
        setValidationMessage('✓ Configuration is valid');
      } else {
        setValidationMessage(`✗ ${result.errors?.length || 0} errors found`);
      }
      setTimeout(() => setValidationMessage(null), 5000);
    } catch (error) {
      setValidationMessage('Validation request failed');
      setTimeout(() => setValidationMessage(null), 3000);
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.alloy';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Format button disabled */}
          {/* <Button variant="outline" size="sm" onClick={handleFormat}>
            <FileCode className="h-4 w-4 mr-2" />
            Format
          </Button> */}
          {/* Validate button disabled */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            disabled={validating}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {validating ? 'Validating...' : 'Validate'}
          </Button> */}
          {settings.showPipelineVisualization && (
            <Button variant="outline" size="sm" onClick={() => setPipelineOpen(true)}>
              <Workflow className="h-4 w-4 mr-2" />
              View Pipeline
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setMode('builder')}>
            Switch to Builder
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {validationMessage && (
            <span className="text-sm text-muted-foreground">{validationMessage}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>

      <PipelineOverlay
        open={pipelineOpen}
        onOpenChange={setPipelineOpen}
        config={currentConfig}
      />
    </>
  );
}
