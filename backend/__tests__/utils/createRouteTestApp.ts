import express, { type Application, type RequestHandler, type Router } from 'express';
import { errorHandler } from '@enterpriseglue/shared/middleware/errorHandler.js';

interface CreateRouteTestAppOptions {
  beforeRouterMiddleware?: RequestHandler[];
  useErrorHandler?: boolean;
  useJson?: boolean;
  useUrlEncoded?: boolean;
}

export function createRouteTestApp(
  router: Router | Router[],
  options: CreateRouteTestAppOptions = {}
): Application {
  const app = express();
  const routers = Array.isArray(router) ? router : [router];
  app.disable('x-powered-by');

  if (options.useJson !== false) {
    app.use(express.json());
  }

  if (options.useUrlEncoded) {
    app.use(express.urlencoded({ extended: false }));
  }

  for (const middleware of options.beforeRouterMiddleware ?? []) {
    app.use(middleware);
  }

  for (const mountedRouter of routers) {
    app.use(mountedRouter);
  }

  if (options.useErrorHandler) {
    app.use(errorHandler);
  }

  return app;
}
