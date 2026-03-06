import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../../../../frontend/test/mocks/server';

// Polyfill Blob.stream() for Node 20 + jsdom 28 compatibility
// Node 20's Blob doesn't expose .stream() which jsdom 28's Response.blob() needs
if (typeof Blob !== 'undefined' && !Blob.prototype.stream) {
  (Blob.prototype as any).stream = function () {
    return new ReadableStream({
      start: async (controller) => {
        const buf = await (this as Blob).arrayBuffer();
        controller.enqueue(new Uint8Array(buf));
        controller.close();
      },
    });
  };
}

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as any).ResizeObserver = TestResizeObserver;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
