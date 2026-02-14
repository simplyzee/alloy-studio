// Core Types for Alloy Studio

export type StabilityLevel = "stable" | "beta" | "experimental" | "public-preview";
export type SignalType = "metrics" | "logs" | "traces" | "profiles";
export type ComponentType = "source" | "processor" | "exporter" | "discovery" | "auth" | "connector";

export interface Argument {
  name: string;
  type: "string" | "number" | "boolean" | "duration" | "object" | "array";
  required: boolean;
  default?: any;
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface Block {
  name: string;
  required: boolean;
  repeatable: boolean;
  arguments: Argument[];
  nestedBlocks?: Block[];
}

export interface Export {
  name: string;
  type: string;
  description: string;
}

export interface Example {
  title: string;
  description: string;
  code: string;
}

export interface Component {
  id: string;
  category: string;
  name: string;
  displayName: string;
  description: string;
  stability: StabilityLevel;
  signals: SignalType[];
  type: ComponentType;
  arguments: Argument[];
  blocks: Block[];
  exports: Export[];
  examples: Example[];
  documentationUrl: string;
}

export interface Variable {
  name: string;
  type: string;
  default: string;
  description: string;
  validation?: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  signals: SignalType[];
  components: string[];
  configuration: string;
  documentation: {
    overview: string;
    prerequisites: string[];
    steps: string[];
    troubleshooting: string[];
  };
  variables: Variable[];
  relatedRecipes: string[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResponse {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  formatted_config?: string;
}

export interface FormatResponse {
  formatted_config: string;
}

export interface AppState {
  mode: "builder" | "editor";
  currentConfig: string;
  selectedComponents: Component[];
  selectedRecipe: Recipe | null;
  settings: {
    stabilityLevel: StabilityLevel;
    enableCommunityComponents: boolean;
    outputFormat: "alloy" | "yaml";
    theme: "dark" | "light";
    autoFormatOnSave: boolean;
    showPipelineVisualization: boolean;
  };
}
