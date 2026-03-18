import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerToHostMessage, HostToPeerMessage } from '../types/network';
import { roomCodeToPeerId } from './roomCode';

export type PeerMessage = PeerToHostMessage | HostToPeerMessage;

export class PeerManager {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private isHost = false;

  // Callbacks
  onPeerConnected: ((peerId: string) => void) | null = null;
  onPeerDisconnected: ((peerId: string) => void) | null = null;
  onMessageFromPeer: ((peerId: string, msg: PeerToHostMessage) => void) | null = null;
  onMessageFromHost: ((msg: HostToPeerMessage) => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onOpen: (() => void) | null = null;

  createHost(roomCode: string): Promise<void> {
    this.isHost = true;
    const peerId = roomCodeToPeerId(roomCode);

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId);

      this.peer.on('open', () => {
        this.onOpen?.();
        resolve();
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        const message = err.type === 'unavailable-id'
          ? 'Room code already in use'
          : `Connection error: ${err.message}`;
        this.onError?.(message);
        reject(new Error(message));
      });

      this.peer.on('disconnected', () => {
        // Try to reconnect to signaling server
        this.peer?.reconnect();
      });
    });
  }

  joinRoom(roomCode: string): Promise<void> {
    this.isHost = false;
    const hostPeerId = roomCodeToPeerId(roomCode);

    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on('open', () => {
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.setupConnection(conn);

        conn.on('open', () => {
          this.onOpen?.();
          resolve();
        });

        conn.on('error', (err) => {
          this.onError?.(`Failed to connect: ${err.message}`);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        const message = err.type === 'peer-unavailable'
          ? 'Room not found'
          : `Connection error: ${err.message}`;
        this.onError?.(message);
        reject(new Error(message));
      });
    });
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (this.isHost) {
        this.onPeerConnected?.(conn.peer);
      }
    });

    conn.on('data', (data) => {
      const msg = data as PeerMessage;
      if (this.isHost) {
        this.onMessageFromPeer?.(conn.peer, msg as PeerToHostMessage);
      } else {
        this.onMessageFromHost?.(msg as HostToPeerMessage);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.isHost) {
        this.onPeerDisconnected?.(conn.peer);
      } else {
        this.onMessageFromHost?.({ type: 'HOST_DISCONNECTED' });
      }
    });

    conn.on('error', (err) => {
      this.onError?.(`Peer connection error: ${err.message}`);
    });
  }

  broadcast(msg: HostToPeerMessage) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  sendToHost(msg: PeerToHostMessage) {
    // Peer only has one connection — to the host
    const conn = this.connections.values().next().value;
    if (conn?.open) {
      conn.send(msg);
    }
  }

  sendToPeer(peerId: string, msg: HostToPeerMessage) {
    const conn = this.connections.get(peerId);
    if (conn?.open) {
      conn.send(msg);
    }
  }

  destroy() {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
    this.isHost = false;
  }

  get connectedPeerIds(): string[] {
    return [...this.connections.keys()];
  }
}
