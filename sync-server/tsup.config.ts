import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  clean: true,
  noExternal: ['y-websocket'] // This is the magic line
});