import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState } from '../types/game';
import type {
  PeerGameState,
  RoomState,
  LobbyPlayer,
  ConnectionStatus,
} from '../types/network';
import { PeerManager } from '../network/PeerManager';
import { generateRoomCode } from '../network/roomCode';
import { MAX_ONLINE_PLAYERS, PLAYER_NAME_KEY } from '../utils/constants';

function stateToPeerState(state: GameState): PeerGameState {
  return {
    board: state.board,
    selected: state.selected,
    setsFound: state.setsFound,
    gameMode: state.gameMode,
    players: state.players,
    claim: state.claim,
    gameOver: state.gameOver,
    hintCardId: state.hintCardId,
    timerEnabled: state.timerEnabled,
    elapsedSeconds: state.elapsedSeconds,
    deckSize: state.deck.length,
  };
}

function peerStateToGameState(peerState: PeerGameState): GameState {
  return {
    deck: [],
    board: peerState.board,
    selected: peerState.selected,
    setsFound: peerState.setsFound,
    gameMode: peerState.gameMode,
    players: peerState.players,
    claim: peerState.claim,
    gameOver: peerState.gameOver,
    hintCardId: peerState.hintCardId,
    timerEnabled: peerState.timerEnabled,
    elapsedSeconds: peerState.elapsedSeconds,
  };
}

const initialRoomState: RoomState = {
  roomCode: '',
  isHost: false,
  localPlayerId: -1,
  localPlayerName: '',
  connectionStatus: 'disconnected',
  lobbyPlayers: [],
  error: null,
};

export function useOnlineMultiplayer() {
  const peerRef = useRef<PeerManager | null>(null);
  const [roomState, setRoomState] = useState<RoomState>(initialRoomState);
  const [peerGameState, setPeerGameState] = useState<PeerGameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [hostDisconnected, setHostDisconnected] = useState(false);

  // Track host's dispatch for message handling
  const hostDispatchRef = useRef<React.Dispatch<import('../types/game').GameAction> | null>(null);
  const hostStateRef = useRef<GameState | null>(null);
  // Track lobby players in ref for use in callbacks
  const lobbyPlayersRef = useRef<LobbyPlayer[]>([]);

  const updateLobbyPlayers = useCallback((updater: (prev: LobbyPlayer[]) => LobbyPlayer[]) => {
    setRoomState((prev) => {
      const newPlayers = updater(prev.lobbyPlayers);
      lobbyPlayersRef.current = newPlayers;
      return { ...prev, lobbyPlayers: newPlayers };
    });
  }, []);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    setRoomState((prev) => ({ ...prev, connectionStatus: status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setRoomState((prev) => ({
      ...prev,
      error,
      connectionStatus: error ? 'error' : prev.connectionStatus,
    }));
  }, []);

  const createRoom = useCallback(async (playerName: string) => {
    const pm = new PeerManager();
    peerRef.current = pm;
    const roomCode = generateRoomCode();

    localStorage.setItem(PLAYER_NAME_KEY, playerName);

    const hostPlayer: LobbyPlayer = {
      id: 'host',
      name: playerName,
      connected: true,
      playerId: 0,
    };

    setRoomState({
      roomCode,
      isHost: true,
      localPlayerId: 0,
      localPlayerName: playerName,
      connectionStatus: 'connecting',
      lobbyPlayers: [hostPlayer],
      error: null,
    });
    lobbyPlayersRef.current = [hostPlayer];

    pm.onPeerConnected = (peerId) => {
      // Add peer to lobby with next available playerId
      updateLobbyPlayers((prev) => {
        if (prev.length >= MAX_ONLINE_PLAYERS) {
          pm.sendToPeer(peerId, { type: 'ERROR', message: 'Room is full' });
          return prev;
        }
        const nextId = prev.length;
        const newPlayer: LobbyPlayer = {
          id: peerId,
          name: `Player ${nextId + 1}`,
          connected: true,
          playerId: nextId,
        };
        const updated = [...prev, newPlayer];
        // Send player assignment
        pm.sendToPeer(peerId, { type: 'PLAYER_ASSIGNED', playerId: nextId });
        // Broadcast lobby update after a tick to include the new player
        setTimeout(() => {
          pm.broadcast({ type: 'LOBBY_UPDATE', players: lobbyPlayersRef.current });
        }, 50);
        return updated;
      });
    };

    pm.onPeerDisconnected = (peerId) => {
      updateLobbyPlayers((prev) => {
        const updated = prev.map((p) =>
          p.id === peerId ? { ...p, connected: false } : p
        );
        pm.broadcast({ type: 'LOBBY_UPDATE', players: updated });
        return updated;
      });

      // If game started and player had active claim, timeout it
      if (hostDispatchRef.current && hostStateRef.current) {
        const disconnectedPlayer = lobbyPlayersRef.current.find((p) => p.id === peerId);
        if (
          disconnectedPlayer &&
          hostStateRef.current.claim.active &&
          hostStateRef.current.claim.playerId === disconnectedPlayer.playerId
        ) {
          hostDispatchRef.current({ type: 'CLAIM_TIMEOUT' });
        }
      }
    };

    pm.onMessageFromPeer = (peerId, msg) => {
      if (msg.type === 'PLAYER_INFO') {
        updateLobbyPlayers((prev) => {
          const updated = prev.map((p) =>
            p.id === peerId ? { ...p, name: msg.name } : p
          );
          pm.broadcast({ type: 'LOBBY_UPDATE', players: updated });
          return updated;
        });
        return;
      }

      // Forward game actions to host's reducer
      if (hostDispatchRef.current) {
        switch (msg.type) {
          case 'CLAIM':
            hostDispatchRef.current({ type: 'CLAIM', playerId: msg.playerId });
            break;
          case 'SELECT_CARD':
            hostDispatchRef.current({ type: 'SELECT_CARD', cardId: msg.cardId });
            break;
          case 'DESELECT_CARD':
            hostDispatchRef.current({ type: 'DESELECT_CARD', cardId: msg.cardId });
            break;
        }
      }
    };

    pm.onError = (errMsg) => {
      setError(errMsg);
    };

    try {
      await pm.createHost(roomCode);
      setConnectionStatus('connected');
    } catch {
      // Error already handled by onError callback
    }
  }, [updateLobbyPlayers, setConnectionStatus, setError]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    const pm = new PeerManager();
    peerRef.current = pm;

    localStorage.setItem(PLAYER_NAME_KEY, playerName);

    setRoomState({
      roomCode: roomCode.toUpperCase(),
      isHost: false,
      localPlayerId: -1,
      localPlayerName: playerName,
      connectionStatus: 'connecting',
      lobbyPlayers: [],
      error: null,
    });

    pm.onMessageFromHost = (msg) => {
      switch (msg.type) {
        case 'PLAYER_ASSIGNED':
          setRoomState((prev) => ({ ...prev, localPlayerId: msg.playerId }));
          // Send our name to host
          pm.sendToHost({ type: 'PLAYER_INFO', name: playerName });
          break;
        case 'LOBBY_UPDATE':
          setRoomState((prev) => ({ ...prev, lobbyPlayers: msg.players }));
          lobbyPlayersRef.current = msg.players;
          break;
        case 'GAME_STARTED':
          setGameStarted(true);
          break;
        case 'STATE_UPDATE':
          setPeerGameState(msg.state);
          break;
        case 'HOST_DISCONNECTED':
          setHostDisconnected(true);
          break;
        case 'ERROR':
          setError(msg.message);
          break;
      }
    };

    pm.onError = (errMsg) => {
      setError(errMsg);
    };

    try {
      await pm.joinRoom(roomCode);
      setConnectionStatus('connected');
    } catch {
      // Error already handled by onError callback
    }
  }, [setConnectionStatus, setError]);

  const leaveRoom = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    setRoomState(initialRoomState);
    setPeerGameState(null);
    setGameStarted(false);
    setHostDisconnected(false);
    hostDispatchRef.current = null;
    hostStateRef.current = null;
    lobbyPlayersRef.current = [];
  }, []);

  // Store player names at start time so OnlineHostProvider can dispatch START_GAME
  const playerNamesRef = useRef<string[]>([]);

  const startOnlineGame = useCallback(() => {
    if (!roomState.isHost) return;
    playerNamesRef.current = roomState.lobbyPlayers.map((p) => p.name);
    setGameStarted(true);
    peerRef.current?.broadcast({ type: 'GAME_STARTED' });
  }, [roomState.isHost, roomState.lobbyPlayers]);

  const getPlayerNames = useCallback(() => playerNamesRef.current, []);

  // Host: broadcast state after dispatch
  const broadcastState = useCallback((state: GameState) => {
    if (!roomState.isHost || !peerRef.current) return;
    hostStateRef.current = state;
    peerRef.current.broadcast({ type: 'STATE_UPDATE', state: stateToPeerState(state) });
  }, [roomState.isHost]);

  // Host: register dispatch for receiving peer messages
  const registerHostDispatch = useCallback((dispatch: React.Dispatch<import('../types/game').GameAction>) => {
    hostDispatchRef.current = dispatch;
  }, []);

  // Peer: send actions to host
  const claimOnline = useCallback((playerId: number) => {
    if (roomState.isHost) {
      // Host claims locally
      hostDispatchRef.current?.({ type: 'CLAIM', playerId });
    } else {
      peerRef.current?.sendToHost({ type: 'CLAIM', playerId });
    }
  }, [roomState.isHost]);

  const selectCardOnline = useCallback((cardId: number) => {
    if (roomState.isHost) {
      hostDispatchRef.current?.({ type: 'SELECT_CARD', cardId });
    } else {
      peerRef.current?.sendToHost({ type: 'SELECT_CARD', cardId });
    }
  }, [roomState.isHost]);

  const deselectCardOnline = useCallback((cardId: number) => {
    if (roomState.isHost) {
      hostDispatchRef.current?.({ type: 'DESELECT_CARD', cardId });
    } else {
      peerRef.current?.sendToHost({ type: 'DESELECT_CARD', cardId });
    }
  }, [roomState.isHost]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  // Derive peer game state as GameState for context consumption
  const peerGameStateAsGameState = peerGameState ? peerStateToGameState(peerGameState) : null;

  return {
    roomState,
    peerGameState,
    peerGameStateAsGameState,
    gameStarted,
    hostDisconnected,
    createRoom,
    joinRoom,
    leaveRoom,
    startOnlineGame,
    broadcastState,
    registerHostDispatch,
    claimOnline,
    selectCardOnline,
    deselectCardOnline,
    getPlayerNames,
  };
}
