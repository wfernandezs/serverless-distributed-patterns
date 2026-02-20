import { Tracer } from "@aws-lambda-powertools/tracer";

/**
 * Add trace annotations and metadata for distributed tracing
 * This allows tracking requests across all AWS services (API Gateway, Lambda, DynamoDB, Step Functions)
 *
 * @param tracer - The Powertools Tracer instance
 * @param annotations - Key-value pairs for filtering traces (e.g., orderId, customerId)
 * @param metadata - Additional context data for debugging
 */
export function addTraceContext(
  tracer: Tracer,
  annotations?: Record<string, string | number>,
  metadata?: Record<string, any>,
): void {
  if (annotations) {
    Object.entries(annotations).forEach(([key, value]) => {
      tracer.putAnnotation(key, value);
    });
  }

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      tracer.putMetadata(key, value);
    });
  }
}

/**
 * Create a tracer instance for a service
 * @param serviceName - Name of the service for identification in X-Ray
 * @returns Configured Tracer instance
 */
export function createTracer(serviceName: string): Tracer {
  return new Tracer({ serviceName });
}
