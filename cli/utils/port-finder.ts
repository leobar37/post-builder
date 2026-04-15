import { createServer } from 'net';

/**
 * Find an available port starting from a given port
 */
export function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        server.close(() => {
          findAvailablePort(startPort + 1)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(err);
      }
    });

    server.listen(startPort, '0.0.0.0', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : startPort;
      server.close(() => resolve(port));
    });
  });
}


