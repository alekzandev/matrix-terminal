// import { defineConfig } from 'vite';

// export default defineConfig({
//   server: {
//     port: 3000,
//     host: true
//   },
//   build: {
//     target: 'es2020',
//     outDir: 'dist',
//     rollupOptions: {
//       input: {
//         main: './index.html'
//       }
//     }
//   },
//   define: {
//     global: 'globalThis',
//   },
//   optimizeDeps: {
//     include: ['lit', 'lit/decorators.js']
//   }
// });

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow external connections
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      // 'ec2-52-87-174-59.compute-1.amazonaws.com', // Your specific AWS host
      'ec2-52-90-156-38.compute-1.amazonaws.com', // Example AWS host
      '.compute-1.amazonaws.com', // Allow all AWS compute hosts in us-east-1
      '.amazonaws.com' // Allow all AWS hosts (broader)
    ],
    // http://ec2-52-90-156-38.compute-1.amazonaws.com:3000/
    cors: {
      origin: [
        'http://localhost:3000',
        // 'https://ec2-52-87-174-59.compute-1.amazonaws.com',
        // 'http://ec2-52-87-174-59.compute-1.amazonaws.com',
        'https://ec2-52-90-156-38.compute-1.amazonaws.com',
        'http://ec2-52-90-156-38.compute-1.amazonaws.com'
      ],
      credentials: true
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        // Optimize Matrix terminal components
        manualChunks: {
          'matrix-terminal': ['./src/components/matrix-terminal.ts'],
          'terminal-services': ['./src/services/terminal-api.ts', './src/services/websocket-client.ts']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['lit', 'lit/decorators.js']
  }
});