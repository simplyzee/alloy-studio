/**
 * Parse Alloy configuration to extract pipeline flow
 */

export interface PipelineNode {
  id: string;
  label: string;
  type: 'source' | 'processor' | 'exporter' | 'discovery';
  componentType: string; // e.g., 'prometheus.scrape', 'loki.write'
}

export interface PipelineEdge {
  from: string;
  to: string;
  label?: string;
}

export interface Pipeline {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

/**
 * Extract component blocks from Alloy config
 */
function extractComponents(config: string): Array<{ type: string; label: string; body: string }> {
  const components: Array<{ type: string; label: string; body: string }> = [];

  // Regex to match component blocks: component.type "label" { ... }
  const componentRegex = /([a-z_]\w*\.[a-z_]\w*)\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;

  let match;
  while ((match = componentRegex.exec(config)) !== null) {
    components.push({
      type: match[1],
      label: match[2],
      body: match[3],
    });
  }

  return components;
}

/**
 * Determine node type from component type
 */
function getNodeType(componentType: string): PipelineNode['type'] {
  // Discovery components
  if (componentType.includes('.discovery') ||
      componentType.startsWith('discovery.') ||
      componentType.startsWith('consul') ||
      componentType.startsWith('docker') ||
      componentType.startsWith('dns') ||
      componentType.startsWith('ec2') ||
      componentType.startsWith('eureka') ||
      componentType.startsWith('digitalocean') ||
      componentType.startsWith('hetzner') ||
      componentType.startsWith('linode')) {
    return 'discovery';
  }

  // Source/Collection components
  if (componentType.includes('.source') ||
      componentType.includes('.scrape') ||
      componentType.includes('.receiver') ||
      componentType.startsWith('prometheus.scrape') ||
      componentType.startsWith('loki.source') ||
      componentType.startsWith('otelcol.receiver') ||
      componentType.startsWith('pyroscope.scrape') ||
      componentType.startsWith('pyroscope.ebpf') ||
      componentType.startsWith('faro.receiver') ||
      componentType.startsWith('prometheus.exporter') ||
      componentType.startsWith('local.file')) {
    return 'source';
  }

  // Exporter/Write components
  if (componentType.includes('.write') ||
      componentType.includes('.remote_write') ||
      componentType.includes('.exporter') ||
      componentType.startsWith('prometheus.remote_write') ||
      componentType.startsWith('loki.write') ||
      componentType.startsWith('pyroscope.write') ||
      componentType.startsWith('otelcol.exporter')) {
    return 'exporter';
  }

  // Processor/Transform components
  if (componentType.includes('.process') ||
      componentType.includes('.processor') ||
      componentType.includes('.relabel') ||
      componentType.startsWith('loki.process') ||
      componentType.startsWith('prometheus.relabel') ||
      componentType.startsWith('otelcol.processor') ||
      componentType.startsWith('otelcol.connector')) {
    return 'processor';
  }

  return 'processor'; // Default
}

/**
 * Extract forward_to references from component body
 */
function extractForwardTo(body: string): string[] {
  const forwardTo: string[] = [];

  // Match forward_to = [receiver1, receiver2] or forward_to = receiver
  const forwardToRegex = /forward_to\s*=\s*\[([^\]]+)\]/g;
  const singleForwardToRegex = /forward_to\s*=\s*([a-z_]\w*\.[a-z_]\w*\.[a-z_]\w*)/g;

  let match;
  while ((match = forwardToRegex.exec(body)) !== null) {
    const receivers = match[1].split(',').map(r => r.trim());
    forwardTo.push(...receivers);
  }

  while ((match = singleForwardToRegex.exec(body)) !== null) {
    forwardTo.push(match[1]);
  }

  return forwardTo;
}

/**
 * Extract output references from OTEL components
 */
function extractOutputs(body: string): string[] {
  const outputs: string[] = [];

  // Match output { metrics/logs/traces = [...] }
  const outputRegex = /(?:metrics|logs|traces)\s*=\s*\[([^\]]+)\]/g;

  let match;
  while ((match = outputRegex.exec(body)) !== null) {
    const receivers = match[1].split(',').map(r => r.trim());
    outputs.push(...receivers);
  }

  return outputs;
}

/**
 * Extract targets references (e.g., discovery targets)
 */
function extractTargets(body: string): string[] {
  const targets: string[] = [];

  // Match targets = discovery.kubernetes.pods.targets
  const targetsRegex = /targets\s*=\s*([a-z_]\w*\.[a-z_]\w*\.[a-z_]\w*)/g;

  let match;
  while ((match = targetsRegex.exec(body)) !== null) {
    targets.push(match[1]);
  }

  return targets;
}

/**
 * Parse Alloy configuration into pipeline structure
 */
export function parsePipeline(config: string): Pipeline {
  if (!config || config.trim() === '') {
    return { nodes: [], edges: [] };
  }

  const components = extractComponents(config);
  const nodes: PipelineNode[] = [];
  const edges: PipelineEdge[] = [];

  // Create nodes
  components.forEach(({ type, label, body }) => {
    const nodeId = `${type}.${label}`;
    nodes.push({
      id: nodeId,
      label: label,
      type: getNodeType(type),
      componentType: type,
    });

    // Extract forward_to edges
    const forwardToRefs = extractForwardTo(body);
    forwardToRefs.forEach(ref => {
      // Remove brackets and quotes if present
      const cleanRef = ref.replace(/[\[\]"']/g, '').trim();
      if (cleanRef && !cleanRef.startsWith('//')) {
        edges.push({
          from: nodeId,
          to: cleanRef,
          label: 'forward_to',
        });
      }
    });

    // Extract output edges (OTEL components)
    const outputRefs = extractOutputs(body);
    outputRefs.forEach(ref => {
      const cleanRef = ref.replace(/[\[\]"']/g, '').trim();
      if (cleanRef && !cleanRef.startsWith('//')) {
        edges.push({
          from: nodeId,
          to: cleanRef,
          label: 'output',
        });
      }
    });

    // Extract target references (reverse edge - discovery feeds into scraper)
    const targetRefs = extractTargets(body);
    targetRefs.forEach(ref => {
      const cleanRef = ref.replace(/\.targets$/, '').trim(); // Remove .targets suffix
      if (cleanRef && !cleanRef.startsWith('//')) {
        edges.push({
          from: cleanRef,
          to: nodeId,
          label: 'targets',
        });
      }
    });
  });

  return { nodes, edges };
}
