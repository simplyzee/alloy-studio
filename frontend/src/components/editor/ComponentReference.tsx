import { useState, useMemo } from 'react';
import { Search, BookOpen, ExternalLink, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import type { Component } from '@/lib/types';
import { api } from '@/lib/api';
import { useEffect } from 'react';

export function ComponentReference() {
  const [components, setComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['prometheus']));
  const { setConfig, currentConfig } = useAppStore();

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

  const categories = useMemo(() => {
    const cats = new Map<string, Component[]>();
    components.forEach(comp => {
      if (!cats.has(comp.category)) {
        cats.set(comp.category, []);
      }
      cats.get(comp.category)?.push(comp);
    });
    return Array.from(cats.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [components]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;

    return categories
      .map(([cat, comps]) => [
        cat,
        comps.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.displayName.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
        )
      ] as [string, Component[]])
      .filter(([_, comps]) => comps.length > 0);
  }, [categories, search]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const insertTemplate = (component: Component) => {
    const example = component.examples && component.examples[0];
    const template = example ? example.code : `${component.name} "default" {\n  // Configure ${component.displayName}\n}`;

    // Append to current config
    const newConfig = currentConfig ? `${currentConfig}\n\n${template}` : template;
    setConfig(newConfig);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Component Reference</h2>
        </div>
        <Input
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto">
        {selectedComponent ? (
          // Component Detail View
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedComponent(null)}
              className="mb-4"
            >
              ← Back to list
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedComponent.displayName}</CardTitle>
                    <code className="text-sm text-muted-foreground">{selectedComponent.name}</code>
                  </div>
                  <Badge variant="secondary">{selectedComponent.stability}</Badge>
                </div>
                <CardDescription className="mt-2">{selectedComponent.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Signals */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Signal Types</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedComponent.signals.map(signal => (
                      <Badge key={signal} variant="outline">{signal}</Badge>
                    ))}
                  </div>
                </div>

                {/* Arguments */}
                {selectedComponent.arguments && selectedComponent.arguments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Arguments</h4>
                    <div className="space-y-2">
                      {selectedComponent.arguments.map(arg => (
                        <div key={arg.name} className="text-sm border-l-2 border-primary/30 pl-3">
                          <div className="font-mono font-medium">
                            {arg.name}
                            {arg.required && <span className="text-red-500">*</span>}
                            <span className="text-muted-foreground ml-2">({arg.type})</span>
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">{arg.description}</div>
                          {arg.default !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Default: <code className="bg-muted px-1 rounded">{JSON.stringify(arg.default)}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocks */}
                {selectedComponent.blocks && selectedComponent.blocks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Blocks</h4>
                    <div className="space-y-2">
                      {selectedComponent.blocks.map(block => (
                        <div key={block.name} className="text-sm border-l-2 border-blue-500/30 pl-3">
                          <div className="font-mono font-medium">
                            {block.name}
                            {block.required && <span className="text-red-500">*</span>}
                            {block.repeatable && <span className="text-blue-500 ml-1">[]</span>}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {block.arguments.length} argument(s)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exports */}
                {selectedComponent.exports && selectedComponent.exports.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Exports</h4>
                    <div className="space-y-2">
                      {selectedComponent.exports.map(exp => (
                        <div key={exp.name} className="text-sm border-l-2 border-green-500/30 pl-3">
                          <div className="font-mono font-medium">
                            {exp.name} <span className="text-muted-foreground">({exp.type})</span>
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">{exp.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {selectedComponent.examples && selectedComponent.examples.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Examples</h4>
                    <div className="space-y-3">
                      {selectedComponent.examples.map((example, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">{example.title}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => insertTemplate(selectedComponent)}
                              className="h-7"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Insert
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">{example.description}</div>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                            <code>{example.code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documentation Link */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedComponent.documentationUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Category List View
          <div className="p-2">
            {filteredCategories.map(([category, comps]) => (
              <div key={category} className="mb-2">
                <button
                  className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{comps.length}</Badge>
                </button>

                {expandedCategories.has(category) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {comps.map(component => (
                      <button
                        key={component.id}
                        className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setSelectedComponent(component)}
                      >
                        <div className="text-sm font-medium truncate">{component.displayName}</div>
                        <code className="text-xs text-muted-foreground truncate block">
                          {component.name}
                        </code>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
