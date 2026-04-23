import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pegjs from 'pegjs';
import path from 'path';

function pegjsPlugin() {
  return {
    name: 'vite-plugin-pegjs',
    transform(code, id) {
      if (id.endsWith('.pegjs')) {
        let allowedStartRules = ['start'];
        if (id.includes('grammar_ra') || id.includes('grammar_bags')) {
          allowedStartRules.push('groupStart');
        } else if (id.includes('grammar_sql') || id.includes('grammar_trc')) {
          allowedStartRules.push('dbDumpStart');
        }

        const parser = pegjs.generate(code, {
          output: 'source',
          format: 'commonjs',
          allowedStartRules: allowedStartRules
        });
        
        return {
          code: `
            const module = { exports: {} };
            ${parser}
            export default module.exports;
          `
        };
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), pegjsPlugin()],
  resolve: {
    alias: {
      'calc2': path.resolve(__dirname, './src/calc2'),
      'db': path.resolve(__dirname, './src/db'),
      'locales': path.resolve(__dirname, './src/locales')
    }
  },
  server: {
    port: 8088,
    strictPort: true,
  },
  base: './',
  css: {
    lightningcss: {
      errorRecovery: true,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 5000,
  }
});
