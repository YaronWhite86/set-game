import { useState, useCallback } from 'react';
import type { Screen, GameMode, GameSettings } from './types/game';
import { GameProvider } from './context/GameContext';
import { OnlineHostProvider, OnlinePeerProvider } from './context/OnlineGameProvider';
import { useGame } from './hooks/useGame';
import { useOnlineMultiplayer } from './hooks/useOnlineMultiplayer';
import { Menu } from './components/Menu/Menu';
import { Lobby } from './components/Lobby/Lobby';
import { HUD } from './components/HUD/HUD';
import { Board } from './components/Board/Board';
import { ClaimBar } from './components/Multiplayer/ClaimBar';
import { GameOver } from './components/GameOver/GameOver';

function LocalGameScreen({ onMenu }: { onMenu: () => void }) {
  const { state, dispatch } = useGame();

  if (state.gameOver) {
    return (
      <GameOver
        state={state}
        onPlayAgain={() =>
          dispatch({
            type: 'START_GAME',
            mode: state.gameMode,
            timerEnabled: state.timerEnabled,
            playerCount: state.players.length || undefined,
            settings: state.settings,
          })
        }
        onMenu={onMenu}
      />
    );
  }

  return (
    <div className="game">
      <HUD onQuit={onMenu} />
      <Board />
      <ClaimBar />
      {state.paused && (
        <div className="pause-overlay">
          <div className="pause-overlay__content">
            <h2>Game Paused</h2>
            <p>Press Escape or click Resume to continue</p>
            <button
              className="pause-overlay__button"
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OnlineGameScreen({
  onMenu,
  online,
}: {
  onMenu: () => void;
  online: ReturnType<typeof useOnlineMultiplayer>;
}) {
  const { state, dispatch } = useGame();

  if (online.hostDisconnected) {
    return (
      <div className="disconnect-overlay">
        <div className="disconnect-overlay__content">
          <h2>Host Disconnected</h2>
          <p>The host has left the game.</p>
          <button className="disconnect-overlay__button" onClick={onMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (state.gameOver) {
    return (
      <GameOver
        state={state}
        onPlayAgain={
          online.roomState.isHost
            ? () => {
                const names = state.players.map((p) => p.name);
                dispatch({
                  type: 'START_GAME',
                  mode: 'online',
                  timerEnabled: false,
                  playerNames: names,
                  settings: state.settings,
                });
              }
            : undefined
        }
        onMenu={onMenu}
        isOnline
        isHost={online.roomState.isHost}
      />
    );
  }

  return (
    <div className="game">
      <HUD onQuit={onMenu} roomCode={online.roomState.roomCode} />
      <Board />
      <ClaimBar />
    </div>
  );
}

function MenuWithProvider({
  onCreateRoom,
  onJoinRoom,
  setScreen,
}: {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  setScreen: (s: Screen) => void;
}) {
  const { dispatch } = useGame();

  const handleStart = useCallback(
    (mode: GameMode, timerEnabled: boolean, playerCount: number, settings: GameSettings) => {
      dispatch({ type: 'START_GAME', mode, timerEnabled, playerCount, settings });
      setScreen('game');
    },
    [dispatch, setScreen]
  );

  return (
    <Menu
      onStart={handleStart}
      onCreateRoom={onCreateRoom}
      onJoinRoom={onJoinRoom}
    />
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const online = useOnlineMultiplayer();

  const handleMenu = useCallback(() => {
    online.leaveRoom();
    setScreen('menu');
  }, [online]);

  const handleCreateRoom = useCallback(
    async (playerName: string) => {
      await online.createRoom(playerName);
      setScreen('lobby');
    },
    [online]
  );

  const handleJoinRoom = useCallback(
    async (roomCode: string, playerName: string) => {
      await online.joinRoom(roomCode, playerName);
      setScreen('lobby');
    },
    [online]
  );

  const handleStartOnlineGame = useCallback(() => {
    online.startOnlineGame();
    setScreen('game');
  }, [online]);

  // Peer auto-transitions from lobby to game when host starts
  if (screen === 'lobby' && online.gameStarted && !online.roomState.isHost) {
    setScreen('game');
  }

  if (screen === 'menu') {
    return (
      <GameProvider>
        <MenuWithProvider
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          setScreen={setScreen}
        />
      </GameProvider>
    );
  }

  if (screen === 'lobby') {
    return (
      <Lobby
        roomState={online.roomState}
        onStart={handleStartOnlineGame}
        onLeave={handleMenu}
      />
    );
  }

  // Online game
  if (online.gameStarted && online.roomState.connectionStatus === 'connected') {
    if (online.roomState.isHost) {
      return (
        <OnlineHostProvider online={online}>
          <OnlineGameScreen onMenu={handleMenu} online={online} />
        </OnlineHostProvider>
      );
    }
    return (
      <OnlinePeerProvider online={online}>
        <OnlineGameScreen onMenu={handleMenu} online={online} />
      </OnlinePeerProvider>
    );
  }

  // Local/single game
  return (
    <GameProvider>
      <LocalGameScreen onMenu={handleMenu} />
    </GameProvider>
  );
}

export default App;
