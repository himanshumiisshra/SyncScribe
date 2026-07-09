// src/types/y-websocket.d.ts

declare module 'y-websocket/bin/utils' {
  import { WebSocket } from 'ws';
  import { IncomingMessage } from 'http';
  import * as Y from 'yjs';

  /**
   * Wires up a WebSocket connection to a Yjs document.
   */
  export const setupWSConnection: (
    conn: WebSocket,
    req: IncomingMessage,
    options?: {
      docName?: string;
      gc?: boolean;
      pingTimeout?: number;
    }
  ) => void;
}