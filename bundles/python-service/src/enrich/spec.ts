export interface RawPythonServiceSpec {
  service: {
    port?: number;
    package: string;
  };
  features?: {
    database?: { enabled?: boolean; type?: string };
    docker?: boolean;
  };
}

export function parseSpec(raw: Record<string, unknown>): RawPythonServiceSpec {
  const spec = raw as unknown as RawPythonServiceSpec;
  return {
    service: {
      port: spec.service.port ?? 8000,
      package: spec.service.package,
    },
    features: {
      database: spec.features?.database ?? { enabled: false },
      docker: spec.features?.docker ?? true,
    },
  };
}
