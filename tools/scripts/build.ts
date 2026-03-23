import * as esbuild from 'esbuild';
import path from 'path';

const sharedAlias = path.resolve(import.meta.dirname, '../../packages/shared/src');

const commonOptions: esbuild.BuildOptions = {
  platform: 'node',
  packages: 'external',
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  alias: {
    '@shared': sharedAlias,
  },
};

await Promise.all([
  esbuild.build({
    ...commonOptions,
    entryPoints: ['apps/server/src/index.ts'],
  }),
  esbuild.build({
    ...commonOptions,
    entryPoints: ['apps/server/src/workers/worker.ts'],
  }),
  esbuild.build({
    ...commonOptions,
    entryPoints: ['tools/scripts/migrate-db.js'],
    outdir: 'dist',
    outbase: '.',
  }),
]);
