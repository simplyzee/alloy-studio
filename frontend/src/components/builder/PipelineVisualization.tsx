import { useMemo } from 'react';
import { parsePipeline, type PipelineNode } from '@/lib/pipelineParser';
import { Database, Boxes, Settings, MapPin, ArrowDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PipelineVisualizationProps {
  config: string;
}

export function PipelineVisualization({ config }: PipelineVisualizationProps) {
  const pipeline = useMemo(() => parsePipeline(config), [config]);

  const layers = useMemo(() => {
    // Group nodes by type/layer with their connections
    const grouped = {
      discovery: pipeline.nodes.filter(n => n.type === 'discovery'),
      source: pipeline.nodes.filter(n => n.type === 'source'),
      processor: pipeline.nodes.filter(n => n.type === 'processor'),
      exporter: pipeline.nodes.filter(n => n.type === 'exporter'),
    };

    // Get connections for each node
    const getConnections = (nodeId: string) => {
      const outgoing = pipeline.edges
        .filter(e => e.from === nodeId)
        .map(e => {
          const targetNode = pipeline.nodes.find(n => n.id === e.to);
          return targetNode ? { id: e.to, label: targetNode.label, type: targetNode.componentType } : null;
        })
        .filter(Boolean);

      const incoming = pipeline.edges
        .filter(e => e.to === nodeId)
        .map(e => {
          const sourceNode = pipeline.nodes.find(n => n.id === e.from);
          return sourceNode ? { id: e.from, label: sourceNode.label, type: sourceNode.componentType } : null;
        })
        .filter(Boolean);

      return { outgoing, incoming };
    };

    return Object.entries(grouped).map(([type, nodes]) => ({
      type: type as 'discovery' | 'source' | 'processor' | 'exporter',
      nodes: nodes.map(node => ({
        ...node,
        connections: getConnections(node.id),
      })),
    })).filter(layer => layer.nodes.length > 0);
  }, [pipeline]);

  if (pipeline.nodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Boxes className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No components to visualize</p>
        <p className="text-xs mt-1">Add components or load a recipe to see the pipeline</p>
      </div>
    );
  }

  const getLayerInfo = (type: string) => {
    switch (type) {
      case 'discovery':
        return {
          title: 'Discovery',
          icon: MapPin,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          description: 'Discovers targets dynamically',
        };
      case 'source':
        return {
          title: 'Data Sources',
          icon: Database,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          description: 'Collects metrics, logs, traces, or profiles',
        };
      case 'processor':
        return {
          title: 'Processing',
          icon: Settings,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          description: 'Transforms and enriches data',
        };
      case 'exporter':
        return {
          title: 'Exporters',
          icon: Database,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          description: 'Sends data to destinations',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Flow */}
      <div className="space-y-6">
        {layers.map((layer, layerIndex) => {
          const info = getLayerInfo(layer.type);
          const Icon = info?.icon || Boxes;

          return (
            <div key={layer.type}>
              {/* Layer Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${info?.bgColor}`}>
                  <Icon className={`h-5 w-5 ${info?.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold ${info?.color}`}>{info?.title}</h3>
                  <p className="text-xs text-muted-foreground">{info?.description}</p>
                </div>
                <Badge variant="secondary">{layer.nodes.length}</Badge>
              </div>

              {/* Components in this layer */}
              <div className="space-y-3 ml-6 pl-4 border-l-2" style={{ borderColor: info?.color.replace('text-', 'rgb(') }}>
                {layer.nodes.map((node, nodeIndex) => (
                  <Card key={node.id} className={`${info?.borderColor} border-l-4`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-semibold">{node.label}</CardTitle>
                          <code className="text-xs text-muted-foreground">{node.componentType}</code>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {node.type}
                        </Badge>
                      </div>
                    </CardHeader>

                    {(node.connections.incoming.length > 0 || node.connections.outgoing.length > 0) && (
                      <CardContent className="pt-0 space-y-2">
                        {/* Incoming connections */}
                        {node.connections.incoming.length > 0 && (
                          <div className="text-xs">
                            <div className="text-muted-foreground font-medium mb-1">← Receives from:</div>
                            <div className="flex flex-wrap gap-1">
                              {node.connections.incoming.map((conn: any) => (
                                <Badge key={conn.id} variant="secondary" className="text-xs">
                                  {conn.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outgoing connections */}
                        {node.connections.outgoing.length > 0 && (
                          <div className="text-xs">
                            <div className="text-muted-foreground font-medium mb-1">→ Forwards to:</div>
                            <div className="flex flex-wrap gap-1">
                              {node.connections.outgoing.map((conn: any) => (
                                <Badge key={conn.id} variant="secondary" className="text-xs">
                                  {conn.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {/* Flow indicator between layers */}
              {layerIndex < layers.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-8 w-px bg-border"></div>
                    <ArrowDown className="h-4 w-4" />
                    <div className="h-8 w-px bg-border"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Components</div>
              <div className="text-2xl font-bold">{pipeline.nodes.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Data Flows</div>
              <div className="text-2xl font-bold">{pipeline.edges.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Data flows from top to bottom</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs h-4 px-1">label</Badge>
          <span className="text-muted-foreground">Component reference</span>
        </div>
      </div>
    </div>
  );
}
