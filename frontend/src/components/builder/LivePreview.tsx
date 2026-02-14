import { useMemo, useCallback, useState } from 'react';
import { Copy, Download, Code, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { PipelineVisualization } from './PipelineVisualization';

export function LivePreview() {
  const { currentConfig, settings } = useAppStore();
  const [view, setView] = useState<'code' | 'pipeline'>('code');

  const highlightAlloy = useCallback((code: string) => {
    if (!code) return '<span class="text-muted-foreground">// Generated configuration will appear here</span>';

    // Escape HTML first
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Use placeholders to prevent regex interference
    const tokens: { placeholder: string; html: string }[] = [];
    let tokenIndex = 0;

    // Replace patterns with placeholders, store the HTML
    const addToken = (match: string, html: string) => {
      const placeholder = `___TOKEN_${tokenIndex}___`;
      tokens.push({ placeholder, html });
      tokenIndex++;
      return placeholder;
    };

    // Comments
    highlighted = highlighted.replace(/(#.*$)/gm, (match) =>
      addToken(match, `<span class="text-gray-500">${match}</span>`)
    );

    // Strings
    highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")/g, (match) =>
      addToken(match, `<span class="text-green-400">${match}</span>`)
    );

    // Component names
    highlighted = highlighted.replace(/\b([a-z_]\w*\.[a-z_]\w*)\b/g, (match) =>
      addToken(match, `<span class="text-cyan-400">${match}</span>`)
    );

    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, (match) =>
      addToken(match, `<span class="text-blue-400">${match}</span>`)
    );

    // Replace placeholders with actual HTML
    tokens.forEach(({ placeholder, html }) => {
      highlighted = highlighted.replace(placeholder, html);
    });

    return highlighted;
  }, []);

  const highlightedConfig = useMemo(() => {
    return highlightAlloy(currentConfig);
  }, [currentConfig, highlightAlloy]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentConfig);
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Live Preview</h2>
        <div className="flex gap-2">
          {settings.showPipelineVisualization && (
            <>
              <Button
                size="sm"
                variant={view === 'code' ? 'default' : 'outline'}
                onClick={() => setView('code')}
              >
                <Code className="h-4 w-4 mr-1" />
                Code
              </Button>
              <Button
                size="sm"
                variant={view === 'pipeline' ? 'default' : 'outline'}
                onClick={() => setView('pipeline')}
              >
                <Workflow className="h-4 w-4 mr-1" />
                Pipeline
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {view === 'code' ? (
          <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
            <pre
              className="whitespace-pre-wrap break-words overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: highlightedConfig }}
            />
          </div>
        ) : (
          <PipelineVisualization config={currentConfig} />
        )}
      </div>
    </div>
  );
}
