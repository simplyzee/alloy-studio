import type { Component } from './types';

/**
 * Generate Alloy configuration template for a component
 */
export function generateComponentConfig(component: Component): string {
  const label = sanitizeLabel(component.name.split('.').pop() || 'default');

  // Component-specific templates
  const templates: Record<string, string> = {
    'prometheus.scrape': `prometheus.scrape "${label}" {
  targets = [{
    __address__ = "localhost:9090",
  }]
  forward_to = [prometheus.remote_write.default.receiver]
}`,

    'prometheus.remote_write': `prometheus.remote_write "${label}" {
  endpoint {
    url = "https://prometheus-prod.grafana.net/api/prom/push"
    basic_auth {
      username = "your-username"
      password = "your-api-key"
    }
  }
}`,

    'loki.source.file': `loki.source.file "${label}" {
  targets = [{
    __path__ = "/var/log/*.log",
    job      = "varlogs",
  }]
  forward_to = [loki.write.default.receiver]
}`,

    'loki.source.kubernetes': `loki.source.kubernetes "${label}" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.write.default.receiver]
}`,

    'loki.write': `loki.write "${label}" {
  endpoint {
    url = "https://logs-prod.grafana.net/loki/api/v1/push"
    basic_auth {
      username = "your-username"
      password = "your-api-key"
    }
  }
}`,

    'loki.process': `loki.process "${label}" {
  forward_to = [loki.write.default.receiver]

  stage.json {
    expressions = {
      level = "level",
    }
  }

  stage.labels {
    values = {
      level = "",
    }
  }
}`,

    'otelcol.receiver.otlp': `otelcol.receiver.otlp "${label}" {
  grpc {
    endpoint = "0.0.0.0:4317"
  }

  http {
    endpoint = "0.0.0.0:4318"
  }

  output {
    metrics = [otelcol.processor.batch.default.input]
    logs    = [otelcol.processor.batch.default.input]
    traces  = [otelcol.processor.batch.default.input]
  }
}`,

    'otelcol.processor.batch': `otelcol.processor.batch "${label}" {
  output {
    metrics = [otelcol.exporter.otlp.default.input]
    logs    = [otelcol.exporter.otlp.default.input]
    traces  = [otelcol.exporter.otlp.default.input]
  }
}`,

    'otelcol.exporter.otlp': `otelcol.exporter.otlp "${label}" {
  client {
    endpoint = "tempo:4317"
    tls {
      insecure = true
    }
  }
}`,

    'discovery.kubernetes': `discovery.kubernetes "${label}" {
  role = "pod"
}`,

    'pyroscope.scrape': `pyroscope.scrape "${label}" {
  targets = [{
    __address__ = "localhost:4040",
  }]
  forward_to = [pyroscope.write.default.receiver]
}`,

    'pyroscope.write': `pyroscope.write "${label}" {
  endpoint {
    url = "https://profiles-prod.grafana.net"
    basic_auth {
      username = "your-username"
      password = "your-api-key"
    }
  }
}`,
  };

  // Return specific template if available, otherwise generate generic template
  return templates[component.id] || generateDefaultTemplate(component);
}

/**
 * Generate a default template for components without specific templates
 */
function generateDefaultTemplate(component: Component): string {
  const label = sanitizeLabel(component.name.split('.').pop() || 'default');

  return `${component.name} "${label}" {
  // TODO: Configure ${component.displayName}
  // ${component.description}
  // Documentation: ${component.documentationUrl}
}`;
}

/**
 * Sanitize label to be valid Alloy identifier
 */
function sanitizeLabel(label: string): string {
  return label
    .replace(/[^a-z0-9_]/gi, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Check if config already contains a component
 */
export function hasComponent(config: string, componentName: string): boolean {
  const regex = new RegExp(`${componentName}\\s+"\\w+"`, 'i');
  return regex.test(config);
}

/**
 * Count occurrences of a component in config
 */
export function countComponent(config: string, componentName: string): number {
  const regex = new RegExp(`${componentName}\\s+"\\w+"`, 'gi');
  const matches = config.match(regex);
  return matches ? matches.length : 0;
}
