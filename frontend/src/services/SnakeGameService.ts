import * as signalR from '@microsoft/signalr';

// Game state interfaces
export interface Point {
  x: number;
  y: number;
}

export interface SnakePlayer {
  connectionId: string;
  playerId: string;
  name: string;
  score: number;
  snakeBody: Point[];
  direction: string;
  color: string;
}

export interface SnakeGameState {
  gameId: string;
  hostConnectionId: string;
  isActive: boolean;
  players: { [key: string]: SnakePlayer };
  flies: Point[];
  boardWidth: number;
  boardHeight: number;
  lastUpdate: string;
  startTime: string;
  maxPlayers: number;
  gameDuration: number;
}

export interface GameSettings {
  boardWidth: number;
  boardHeight: number;
  initialSnakeLength: number;
  maxPlayers: number;
  gameDuration: number;
  flyCount: number;
}

export interface CreateGameRequest {
  playerName: string;
  settings?: GameSettings;
}

export interface JoinGameRequest {
  gameId: string;
  playerName: string;
}

export interface DirectionUpdateRequest {
  direction: string;
}

// Game events
export type GameStateUpdatedCallback = (gameState: SnakeGameState) => void;
export type PlayerJoinedCallback = (gameState: SnakeGameState) => void;
export type PlayerLeftCallback = (gameState: SnakeGameState, connectionId: string) => void;
export type GameStartedCallback = (gameState: SnakeGameState) => void;
export type GameEndedCallback = (gameState: SnakeGameState) => void;
export type ConnectionErrorCallback = (error: Error) => void;

class SnakeGameService {
  private connection: signalR.HubConnection | null = null;
  private connectionPromise: Promise<void> | null = null;
  private gameStateUpdatedCallbacks: GameStateUpdatedCallback[] = [];
  private playerJoinedCallbacks: PlayerJoinedCallback[] = [];
  private playerLeftCallbacks: PlayerLeftCallback[] = [];
  private gameStartedCallbacks: GameStartedCallback[] = [];
  private gameEndedCallbacks: GameEndedCallback[] = [];
  private connectionErrorCallbacks: ConnectionErrorCallback[] = [];
  private _isConnected: boolean = false;
  private currentGameId: string = '';

  get isConnected(): boolean {
    return this._isConnected;
  }

  get gameId(): string {
    return this.currentGameId;
  }

  constructor() {
    // Initialize the connection without starting it
    this.createConnection();
    console.log('SnakeGameService constructor called');
  }

  private createConnection(): void {
    // API URL from environment variable
    const apiUrl = import.meta.env.VITE_API_URL || 'https://localhost:7039';
    console.log('Using API URL:', apiUrl);
    
    try {
      // Create connection with improved configuration
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/hubs/snake`, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 1000, 5000, 10000]) // Retry with increasing delays
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up reconnection events
      this.connection.onreconnecting((error) => {
        console.log('SignalR reconnecting...', error);
        this._isConnected = false;
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected with ID:', connectionId);
        this._isConnected = true;
        
        // If we have a current game, try to get its state
        if (this.currentGameId) {
          this.getGame(this.currentGameId)
            .then(gameState => {
              if (gameState) {
                // Notify listeners of game state update after reconnection
                this.gameStateUpdatedCallbacks.forEach(callback => callback(gameState));
              }
            })
            .catch(error => {
              console.error('Error fetching game state after reconnection:', error);
            });
        }
      });

      // Set up event handlers
      this.connection.on('GameStateUpdated', (gameState: SnakeGameState) => {
        console.log('GameStateUpdated event received');
        this.gameStateUpdatedCallbacks.forEach(callback => callback(gameState));
      });

      this.connection.on('PlayerJoined', (gameState: SnakeGameState) => {
        console.log('PlayerJoined event received');
        this.playerJoinedCallbacks.forEach(callback => callback(gameState));
      });

      this.connection.on('PlayerLeft', (gameState: SnakeGameState, connectionId: string) => {
        console.log('PlayerLeft event received');
        this.playerLeftCallbacks.forEach(callback => callback(gameState, connectionId));
      });

      this.connection.on('GameStarted', (gameState: SnakeGameState) => {
        console.log('GameStarted event received');
        this.gameStartedCallbacks.forEach(callback => callback(gameState));
      });

      this.connection.on('GameEnded', (gameState: SnakeGameState) => {
        console.log('GameEnded event received');
        this.gameEndedCallbacks.forEach(callback => callback(gameState));
        this.currentGameId = '';
      });

      this.connection.onclose((error) => {
        this._isConnected = false;
        console.log('SignalR connection closed', error);
        
        // Notify listeners about connection error
        if (error) {
          this.connectionErrorCallbacks.forEach(callback => callback(error));
        }
      });
      
      console.log('Connection object created successfully');
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  // Start the connection
  public async connect(): Promise<void> {
    try {
      console.log('Attempting to connect to SignalR hub');
      
      if (!this.connection) {
        console.log('Connection not initialized, creating new connection');
        this.createConnection();
      }

      if (this.connection!.state === signalR.HubConnectionState.Disconnected) {
        console.log('Connection is disconnected, starting connection...');
        this.connectionPromise = this.connection!.start();
        await this.connectionPromise;
        this._isConnected = true;
        console.log('SignalR connection established successfully');
      } else {
        console.log('Connection already in state:', this.connection!.state);
      }
    } catch (error) {
      this._isConnected = false;
      console.error('Error connecting to SignalR hub:', error);
      this.connectionErrorCallbacks.forEach(callback => callback(error as Error));
      throw error;
    }
  }

  // Disconnect
  public async disconnect(): Promise<void> {
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.stop();
        this._isConnected = false;
        this.currentGameId = '';
        console.log('SignalR connection stopped');
      }
    } catch (error) {
      console.error('Error disconnecting from SignalR hub:', error);
      throw error;
    }
  }

  // Create a new game
  public async createGame(request: CreateGameRequest): Promise<SnakeGameState> {
    try {
      await this.ensureConnected();
      const gameState = await this.connection!.invoke<SnakeGameState>('CreateGame', request);
      this.currentGameId = gameState.gameId;
      return gameState;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  // Join an existing game
  public async joinGame(request: JoinGameRequest): Promise<boolean> {
    try {
      await this.ensureConnected();
      const result = await this.connection!.invoke<boolean>('JoinGame', request);
      if (result) {
        this.currentGameId = request.gameId;
      }
      return result;
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  }

  // Start the game (host only)
  public async startGame(gameId: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      return await this.connection!.invoke<boolean>('StartGame', gameId);
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  // Update direction
  public async updateDirection(direction: string, gameId: string): Promise<void> {
    try {
      await this.ensureConnected();
      console.log(`Sending direction update: ${direction} for game ${gameId}`);
      
      // Send direction update to server
      await this.connection!.invoke('UpdateDirection', { direction }, gameId);
      
      // Since the server might not send an immediate update, let's also update our local game state
      // for better responsiveness if we have the game state cached
      if (this.currentGameId === gameId) {
        // Manually trigger a game state fetch to ensure we have the latest state
        this.getGame(gameId)
          .then(gameState => {
            if (gameState) {
              console.log('Got updated game state after direction change');
            }
          })
          .catch(err => {
            console.error('Failed to get updated game state after direction change', err);
          });
      }
    } catch (error) {
      console.error('Error updating direction:', error);
      throw error;
    }
  }

  // Get available games
  public async getAvailableGames(): Promise<SnakeGameState[]> {
    try {
      await this.ensureConnected();
      return await this.connection!.invoke<SnakeGameState[]>('GetAvailableGames');
    } catch (error) {
      console.error('Error getting available games:', error);
      throw error;
    }
  }

  // Get a specific game
  public async getGame(gameId: string): Promise<SnakeGameState | null> {
    try {
      await this.ensureConnected();
      return await this.connection!.invoke<SnakeGameState | null>('GetGame', gameId);
    } catch (error) {
      console.error('Error getting game:', error);
      throw error;
    }
  }

  // Event subscriptions
  public onGameStateUpdated(callback: GameStateUpdatedCallback): void {
    this.gameStateUpdatedCallbacks.push(callback);
  }

  public offGameStateUpdated(callback: GameStateUpdatedCallback): void {
    this.gameStateUpdatedCallbacks = this.gameStateUpdatedCallbacks.filter(cb => cb !== callback);
  }

  public onPlayerJoined(callback: PlayerJoinedCallback): void {
    this.playerJoinedCallbacks.push(callback);
  }

  public offPlayerJoined(callback: PlayerJoinedCallback): void {
    this.playerJoinedCallbacks = this.playerJoinedCallbacks.filter(cb => cb !== callback);
  }

  public onPlayerLeft(callback: PlayerLeftCallback): void {
    this.playerLeftCallbacks.push(callback);
  }

  public offPlayerLeft(callback: PlayerLeftCallback): void {
    this.playerLeftCallbacks = this.playerLeftCallbacks.filter(cb => cb !== callback);
  }

  public onGameStarted(callback: GameStartedCallback): void {
    this.gameStartedCallbacks.push(callback);
  }

  public offGameStarted(callback: GameStartedCallback): void {
    this.gameStartedCallbacks = this.gameStartedCallbacks.filter(cb => cb !== callback);
  }

  public onGameEnded(callback: GameEndedCallback): void {
    this.gameEndedCallbacks.push(callback);
  }

  public offGameEnded(callback: GameEndedCallback): void {
    this.gameEndedCallbacks = this.gameEndedCallbacks.filter(cb => cb !== callback);
  }

  public onConnectionError(callback: ConnectionErrorCallback): void {
    this.connectionErrorCallbacks.push(callback);
  }

  public offConnectionError(callback: ConnectionErrorCallback): void {
    this.connectionErrorCallbacks = this.connectionErrorCallbacks.filter(cb => cb !== callback);
  }

  // Helper method to ensure connection is established
  private async ensureConnected(): Promise<void> {
    if (!this._isConnected) {
      await this.connect();
    } else if (this.connectionPromise) {
      await this.connectionPromise;
    }
  }
}

// Export a singleton instance
export const snakeGameService = new SnakeGameService();
export default snakeGameService; 