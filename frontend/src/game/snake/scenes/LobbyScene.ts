import Phaser from 'phaser';
import { snakeGameService, SnakeGameState } from '../../../services/SnakeGameService';

interface LobbySceneData {
  gameId: string;
  playerName: string;
  isHost: boolean;
}

export default class LobbyScene extends Phaser.Scene {
  private gameId: string = '';
  private playerName: string = '';
  private isHost: boolean = false;
  private startButton!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private gameIdText!: Phaser.GameObjects.Text;
  private playerListTexts: Phaser.GameObjects.Text[] = [];
  private players: { name: string, isHost: boolean }[] = [];
  
  // Store bound methods to allow for cleanup
  private onPlayerJoinedBound!: (gameState: SnakeGameState) => void;
  private onPlayerLeftBound!: (gameState: SnakeGameState) => void;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data: LobbySceneData) {
    this.gameId = data.gameId;
    this.playerName = data.playerName;
    this.isHost = data.isHost;
    this.players = [];
  }

  create() {
    // Add background
    this.add.image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height);

    // Add title text
    this.titleText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.15,
      'Game Lobby',
      {
        fontSize: '32px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Add game ID info
    this.gameIdText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.25,
      `Game ID: ${this.gameId}`,
      {
        fontSize: '24px',
        color: '#FFFF00',
        backgroundColor: '#000000',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    ).setOrigin(0.5);

    // Add instructions text
    const instructionsText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.35,
      'Share this Game ID with your friends to let them join!',
      {
        fontSize: '16px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5);

    // Add copy button next to game ID
    const copyButton = this.add.text(
      this.gameIdText.x + this.gameIdText.width / 2 + 30,
      this.gameIdText.y,
      'Copy',
      {
        fontSize: '16px',
        color: '#FFFFFF',
        backgroundColor: '#666666',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    )
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => copyButton.setStyle({ color: '#00FF00' }))
      .on('pointerout', () => copyButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => {
        navigator.clipboard.writeText(this.gameId)
          .then(() => {
            // Show copied confirmation
            copyButton.setText('Copied!');
            this.time.delayedCall(1000, () => copyButton.setText('Copy'));
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
          });
      });

    // Add players heading
    this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.45,
      'Players:',
      {
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Back button
    this.backButton = this.add.text(
      this.scale.width / 2 - 80,
      this.scale.height * 0.85,
      'Leave',
      {
        fontSize: '20px',
        color: '#FFFFFF',
        backgroundColor: '#990000',
        padding: { left: 15, right: 15, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.backButton.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.backButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => this.leaveGame());

    // Start button (only visible for host)
    this.startButton = this.add.text(
      this.scale.width / 2 + 80,
      this.scale.height * 0.85,
      'Start Game',
      {
        fontSize: '20px',
        color: '#FFFFFF',
        backgroundColor: '#009900',
        padding: { left: 15, right: 15, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.startButton.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.startButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => this.startGame())
      .setVisible(this.isHost);

    // Add decorative elements - animated flies
    for (let i = 0; i < 3; i++) {
      const fly = this.add.sprite(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(50, this.scale.height - 50),
        'fly'
      ).play('fly');

      // Add random movement for flies
      this.tweens.add({
        targets: fly,
        x: Phaser.Math.Between(50, this.scale.width - 50),
        y: Phaser.Math.Between(50, this.scale.height - 50),
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    // Register event handlers
    this.registerEventHandlers();

    // Get initial game state
    this.fetchCurrentGameState();
  }

  private registerEventHandlers() {
    // Bind event handlers
    this.onPlayerJoinedBound = this.onPlayerJoined.bind(this);
    this.onPlayerLeftBound = this.onPlayerLeft.bind(this);
    
    const onGameStartedBound = this.onGameStarted.bind(this);
    const onConnectionErrorBound = this.onConnectionError.bind(this);
    
    // Register event handlers
    snakeGameService.onPlayerJoined(this.onPlayerJoinedBound);
    snakeGameService.onPlayerLeft(this.onPlayerLeftBound);
    snakeGameService.onGameStarted(onGameStartedBound);
    snakeGameService.onConnectionError(onConnectionErrorBound);
    
    console.log('LobbyScene: Registered event handlers');
    
    // Clean up when scene is shut down
    this.events.once('shutdown', () => {
      // Remove event handlers
      snakeGameService.offPlayerJoined(this.onPlayerJoinedBound);
      snakeGameService.offPlayerLeft(this.onPlayerLeftBound);
      snakeGameService.offGameStarted(onGameStartedBound);
      snakeGameService.offConnectionError(onConnectionErrorBound);
      console.log('LobbyScene: Unregistered event handlers');
    });
  }

  private onConnectionError(error: Error) {
    console.error('Connection error in lobby:', error);
    this.showError('Lost connection to server. Please try again.');
    
    // Return to menu after a delay
    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }

  private async fetchCurrentGameState() {
    try {
      console.log('LobbyScene: Fetching current game state');
      const gameState = await snakeGameService.getGame(this.gameId);
      
      if (gameState) {
        console.log('LobbyScene: Received game state', gameState);
        this.updatePlayerList(gameState);
        
        // If game is already active, go to game scene
        if (gameState.isActive) {
          console.log('LobbyScene: Game is already active, transitioning to GameScene');
          this.scene.start('GameScene', {
            gameId: this.gameId,
            playerName: this.playerName
          });
        }
      } else {
        console.error('LobbyScene: Game not found');
        this.showError('Game not found. Returning to menu...');
        
        // Return to menu after a delay
        this.time.delayedCall(3000, () => {
          this.scene.start('MenuScene');
        });
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      this.showError('Error connecting to game');
    }
  }

  private onPlayerJoined(gameState: SnakeGameState) {
    this.updatePlayerList(gameState);
  }

  private onPlayerLeft(gameState: SnakeGameState) {
    this.updatePlayerList(gameState);
  }

  private onGameStarted() {
    // Transition to the game scene
    this.scene.start('GameScene', {
      gameId: this.gameId,
      playerName: this.playerName
    });
  }

  private updatePlayerList(gameState: SnakeGameState) {
    // Clear existing player texts
    this.playerListTexts.forEach(text => text.destroy());
    this.playerListTexts = [];

    // Extract players from game state
    this.players = Object.values(gameState.players).map(player => ({
      name: player.name,
      isHost: player.connectionId === gameState.hostConnectionId
    }));

    // Add player texts
    const startY = this.scale.height * 0.5;
    const spacing = 30;

    this.players.forEach((player, index) => {
      const hostIndicator = player.isHost ? ' 👑 (Host)' : '';
      const youIndicator = player.name === this.playerName ? ' (You)' : '';
      
      const playerText = this.add.text(
        this.scale.width / 2,
        startY + index * spacing,
        `${player.name}${youIndicator}${hostIndicator}`,
        {
          fontSize: '18px',
          color: player.name === this.playerName ? '#00FF00' : '#FFFFFF'
        }
      ).setOrigin(0.5);

      this.playerListTexts.push(playerText);
    });

    // Only enable start button for host if there are at least 2 players
    if (this.isHost) {
      this.startButton.setAlpha(this.players.length >= 2 ? 1 : 0.5);
      this.startButton.disableInteractive();
      
      if (this.players.length >= 2) {
        this.startButton.setInteractive({ useHandCursor: true });
      }
    }
  }

  private async startGame() {
    if (!this.isHost || this.players.length < 2) return;

    try {
      this.startButton.setText('Starting...');
      this.startButton.disableInteractive();
      
      const success = await snakeGameService.startGame(this.gameId);
      
      if (!success) {
        this.startButton.setText('Start Game');
        this.startButton.setInteractive({ useHandCursor: true });
        this.showError('Failed to start game. Try again!');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      this.startButton.setText('Start Game');
      this.startButton.setInteractive({ useHandCursor: true });
      this.showError('Failed to start game. Try again!');
    }
  }

  private async leaveGame() {
    try {
      // Disconnect from the SignalR hub
      await snakeGameService.disconnect();
      
      // Go back to the menu
      this.scene.start('MenuScene');
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }

  private showError(message: string) {
    // Show error message
    const errorText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.75,
      message,
      {
        fontSize: '18px',
        color: '#FF0000',
        backgroundColor: '#000000',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    ).setOrigin(0.5);

    // Remove after a few seconds
    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }
} 