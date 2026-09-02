export interface AppConfig {
  port: number;
  elasticsearch: {
    node: string;
    ordersIndex: string;
  };
  rateLimit: {
    ttlSeconds: number;
    limit: number;
  };
  bodySizeLimit: string;
  concurrency: {
    maxConcurrentRequests: number;
  };
  cors: {
    allowedOrigins: string[];
  };
}

// Every setting has a sane default baked in right here, so a bare checkout runs with no env
// vars set at all. Override any of them via a local .env (see .env.example) or real
// environment variables -- @nestjs/config's ConfigModule.forRoot() loads both. This .env is
// server-orders' own (gitignored, .env.example documents it), not the repo-root one
// docker-compose reads for the SQL/Elasticsearch containers.
export default (): AppConfig => ({
  port: Number(process.env.PORT ?? 3001),
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
    ordersIndex: process.env.ORDERS_INDEX ?? 'orders',
  },
  rateLimit: {
    ttlSeconds: Number(process.env.RATE_LIMIT_TTL_SECONDS ?? 60),
    limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
  },
  // Passed straight through to express's json/urlencoded body parsers (see main.ts) -- a
  // string like '1mb', not a byte count, since that's the format the "bytes" package they use
  // under the hood expects.
  bodySizeLimit: process.env.BODY_SIZE_LIMIT ?? '1mb',
  concurrency: {
    // How many requests to OrdersController's routes ConcurrencyLimitMiddleware lets run at
    // once before rejecting new ones with 503 -- see concurrency-limit.middleware.ts.
    maxConcurrentRequests: Number(process.env.MAX_CONCURRENT_REQUESTS ?? 50),
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  },
});
