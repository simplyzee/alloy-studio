import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Blocks, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Component } from '@/lib/types';

export function ComponentPicker() {
  const [components, setComponents] = useState<Component[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [truncatedDescriptions, setTruncatedDescriptions] = useState<Set<string>>(new Set());
  const descriptionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const { addComponent, settings } = useAppStore();

  // Check truncation after components are loaded
  useEffect(() => {
    const checkAllTruncation = () => {
      const truncated = new Set<string>();
      descriptionRefs.current.forEach((element, componentId) => {
        if (element && element.scrollHeight > element.clientHeight) {
          truncated.add(componentId);
        }
      });
      setTruncatedDescriptions(truncated);
    };

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(checkAllTruncation, 100);
    return () => clearTimeout(timer);
  }, [filteredComponents]);

  const toggleDescription = (componentId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    filterComponents();
  }, [search, selectedCategory, components, settings.enableCommunityComponents]);

  const loadComponents = async () => {
    try {
      const data = await api.getComponents();
      setComponents(data);
      setFilteredComponents(data);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  const filterComponents = () => {
    let filtered = components;

    // Filter out community components if setting is disabled
    if (!settings.enableCommunityComponents) {
      filtered = filtered.filter((c) => c.stability !== 'community');
    }

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    setFilteredComponents(filtered);
  };

  const categories = Array.from(new Set(components.map((c) => c.category)));

  const getSignalColor = (signal: string) => {
    const colors: Record<string, string> = {
      metrics: 'bg-blue-500',
      logs: 'bg-green-500',
      traces: 'bg-purple-500',
      profiles: 'bg-orange-500',
    };
    return colors[signal] || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === '' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('')}
          >
            All ({components.length})
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({components.filter(c => c.category === category).length})
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComponents.map((component) => (
          <Card key={component.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold mb-1 truncate">
                    {component.displayName}
                  </CardTitle>
                  <code className="text-xs text-muted-foreground block truncate">{component.name}</code>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addComponent(component)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                  title="Add component"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3">
                <CardDescription
                  ref={(el) => {
                    if (el && !expandedDescriptions.has(component.id)) {
                      descriptionRefs.current.set(component.id, el);
                    }
                  }}
                  className={`text-xs ${expandedDescriptions.has(component.id) ? '' : 'line-clamp-2'}`}
                >
                  {component.description}
                </CardDescription>
                {truncatedDescriptions.has(component.id) && (
                  <button
                    onClick={() => toggleDescription(component.id)}
                    className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                  >
                    {expandedDescriptions.has(component.id) ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                {component.signals.map((signal) => (
                  <div
                    key={signal}
                    className="flex items-center gap-1"
                  >
                    <div className={`h-2 w-2 rounded-full ${getSignalColor(signal)}`} />
                    <span className="text-xs text-muted-foreground">{signal}</span>
                  </div>
                ))}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {component.stability}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Blocks className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No components found matching your search</p>
        </div>
      )}
    </div>
  );
}
