import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Component } from '@/lib/types';

export function MonacoEditor() {
  const { currentConfig, setConfig } = useAppStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [components, setComponents] = useState<Component[]>([]);

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      const data = await api.getComponents();
      setComponents(data);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Register Alloy language
    monacoInstance.languages.register({ id: 'alloy' });

    // Set up syntax highlighting
    monacoInstance.languages.setMonarchTokensProvider('alloy', {
      tokenizer: {
        root: [
          [/[a-z_]\w*\.\w+/, 'component'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
          [/\d+/, 'number'],
          [/[{}[\]()]/, '@brackets'],
          [/[<>]/, '@brackets'],
          [/[=]/, 'delimiter'],
          [/#.*$/, 'comment'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
        ],
      },
    });

    // Define theme
    monacoInstance.editor.defineTheme('alloy-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'component', foreground: '4EC9B0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
      },
    });

    monacoInstance.editor.setTheme('alloy-dark');

    // Add dynamic completion provider based on loaded components
    monacoInstance.languages.registerCompletionItemProvider('alloy', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const currentLine = model.getLineContent(position.lineNumber);
        const beforeCursor = currentLine.substring(0, position.column - 1);

        // Extract existing component instances from config
        const componentInstanceRegex = /([a-z_]\w*\.\w+)\s+"([^"]+)"/g;
        const existingInstances: { type: string; label: string; fullRef: string }[] = [];
        let match;
        while ((match = componentInstanceRegex.exec(model.getValue())) !== null) {
          existingInstances.push({
            type: match[1],
            label: match[2],
            fullRef: `${match[1]}.${match[2]}`,
          });
        }

        const suggestions: monacoInstance.languages.CompletionItem[] = [];

        // Context: Inside forward_to or targets array
        if (beforeCursor.includes('forward_to') || beforeCursor.includes('targets')) {
          const inArray = beforeCursor.includes('[') && !beforeCursor.includes(']');

          if (inArray) {
            // Suggest existing component instances with .receiver/.input/.output
            existingInstances.forEach(instance => {
              // Suggest .receiver for most components
              suggestions.push({
                label: `${instance.fullRef}.receiver`,
                kind: monacoInstance.languages.CompletionItemKind.Reference,
                insertText: `${instance.fullRef}.receiver`,
                documentation: `Forward to ${instance.type} "${instance.label}"`,
                detail: `Reference to ${instance.type}`,
                sortText: '0', // Prioritize references
                range,
              });

              // Also suggest .input for processors
              if (instance.type.includes('processor') || instance.type.includes('relabel')) {
                suggestions.push({
                  label: `${instance.fullRef}.input`,
                  kind: monacoInstance.languages.CompletionItemKind.Reference,
                  insertText: `${instance.fullRef}.input`,
                  documentation: `Forward to ${instance.type} "${instance.label}" input`,
                  detail: `Processor input reference`,
                  sortText: '0',
                  range,
                });
              }

              // Suggest .output for exporters
              if (instance.type.includes('exporter')) {
                suggestions.push({
                  label: `${instance.fullRef}.output`,
                  kind: monacoInstance.languages.CompletionItemKind.Reference,
                  insertText: `${instance.fullRef}.output`,
                  documentation: `Forward to ${instance.type} "${instance.label}" output`,
                  detail: `Exporter output reference`,
                  sortText: '0',
                  range,
                });
              }

              // Suggest .targets for discovery components
              if (instance.type.includes('discovery')) {
                suggestions.push({
                  label: `${instance.fullRef}.targets`,
                  kind: monacoInstance.languages.CompletionItemKind.Reference,
                  insertText: `${instance.fullRef}.targets`,
                  documentation: `Use targets from ${instance.type} "${instance.label}"`,
                  detail: `Discovery targets reference`,
                  sortText: '0',
                  range,
                });
              }
            });
          }
        }

        // Context: After typing component type prefix (e.g., "discovery.")
        const componentPrefix = word.word.match(/^([a-z_]\w*)\./);
        if (componentPrefix) {
          const prefix = componentPrefix[1];
          const matchingComponents = components.filter(c =>
            c.name.startsWith(prefix + '.')
          );

          matchingComponents.forEach(comp => {
            const template = comp.examples?.[0]?.code ||
              `${comp.name} "\${1:label}" {\n\t\${0}\n}`;

            suggestions.push({
              label: comp.name,
              kind: monacoInstance.languages.CompletionItemKind.Class,
              insertText: template,
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: {
                value: `**${comp.displayName}** (${comp.stability})\n\n${comp.description}\n\n**Signals:** ${comp.signals.join(', ')}\n\n**Category:** ${comp.category}`,
                isTrusted: true,
              },
              detail: `${comp.category} - ${comp.type}`,
              sortText: '1',
              range,
            });
          });
        }

        // Default: Suggest all component types
        if (suggestions.length === 0 || !componentPrefix) {
          // Get unique component type prefixes (e.g., "prometheus", "loki", "discovery")
          const prefixes = new Set<string>();
          components.forEach(comp => {
            const parts = comp.name.split('.');
            if (parts.length >= 2) {
              prefixes.add(parts[0]);
            }
          });

          // Add prefix suggestions
          prefixes.forEach(prefix => {
            suggestions.push({
              label: prefix,
              kind: monacoInstance.languages.CompletionItemKind.Module,
              insertText: `${prefix}.`,
              documentation: `${prefix} component namespace`,
              detail: 'Component prefix',
              sortText: '2',
              range,
            });
          });

          // Add full component suggestions
          components.forEach(comp => {
            const template = comp.examples?.[0]?.code ||
              `${comp.name} "\${1:label}" {\n\t\${0}\n}`;

            suggestions.push({
              label: comp.name,
              kind: monacoInstance.languages.CompletionItemKind.Class,
              insertText: template,
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: {
                value: `**${comp.displayName}** (${comp.stability})\n\n${comp.description}\n\n**Signals:** ${comp.signals.join(', ')}`,
                isTrusted: true,
              },
              detail: `${comp.category} - ${comp.type}`,
              sortText: '3',
              range,
            });
          });
        }

        // Add common keywords and attributes
        const keywords = [
          {
            label: 'forward_to',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'forward_to = [${1}]',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Specify where to forward data (array of component references)',
            detail: 'Data routing',
            sortText: '4',
            range,
          },
          {
            label: 'targets',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'targets = ${1}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Define scrape targets or discovery targets reference',
            detail: 'Target configuration',
            sortText: '4',
            range,
          },
          {
            label: 'endpoint',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'endpoint {\n\turl = "${1}"\n\t${0}\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Configure remote write endpoint',
            detail: 'Remote endpoint',
            sortText: '4',
            range,
          },
          {
            label: 'basic_auth',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'basic_auth {\n\tusername = "${1}"\n\tpassword = "${2}"\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Configure basic authentication',
            detail: 'Authentication',
            sortText: '4',
            range,
          },
          {
            label: 'output',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'output {\n\t${1:metrics} = [${2}]\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Configure OTEL component output routing',
            detail: 'OTEL output',
            sortText: '4',
            range,
          },
          {
            label: 'rule',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'rule {\n\tsource_labels = ["${1}"]\n\ttarget_label = "${2}"\n\t${0}\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add relabeling rule',
            detail: 'Relabeling',
            sortText: '4',
            range,
          },
          {
            label: 'stage.json',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'stage.json {\n\texpressions = {\n\t\t${1:field} = "${2:json_path}"\n\t}\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Parse JSON logs',
            detail: 'Loki processing',
            sortText: '4',
            range,
          },
          {
            label: 'stage.labels',
            kind: monacoInstance.languages.CompletionItemKind.Property,
            insertText: 'stage.labels {\n\tvalues = {\n\t\t${1:label} = ""\n\t}\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Extract labels from log entries',
            detail: 'Loki processing',
            sortText: '4',
            range,
          },
        ];

        return { suggestions: [...suggestions, ...keywords] };
      },
      triggerCharacters: ['.', '"', '['],
    });
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="alloy"
        value={currentConfig}
        onChange={(value) => setConfig(value || '')}
        onMount={handleEditorDidMount}
        theme="alloy-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
