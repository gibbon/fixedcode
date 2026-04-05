export interface RawTsServiceSpec {
  service: {
    port?: number;
    package: string;
  };
  features?: {
    database?: { enabled?: boolean; type?: string };
    docker?: boolean;
  };
}

export function parseSpec(raw: Record<string, unknown>): RawTsServiceSpec {
  const spec = raw as unknown as RawTsServiceSpec;
  return {
    service: {
      port: spec.service.port ?? 3000,
      package: spec.service.package,
    },
    features: {
      database: spec.features?.database ?? { enabled: false },
      docker: spec.features?.docker ?? true,
    },
  };
}
