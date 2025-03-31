import Phaser from 'phaser';
import { snakeGameService, SnakeGameState, Point } from '../../../services/SnakeGameService';

interface GameSceneData {
  gameId: string;
  playerName: string;
}

export default class GameScene extends Phaser.Scene {
  // Game parameters
  private gameId: string = '';
  private playerName: string = '';
  private gameState?: SnakeGameState;
  private gridSize: number = 16; // Size of each grid cell in pixels
  private myConnectionId?: string;

  // Game objects
  private snakeSprites: Map<string, Phaser.GameObjects.Group> = new Map();
  private flySprites: Phaser.GameObjects.Sprite[] = [];
  private scoreTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private timerText!: Phaser.GameObjects.Text;
  private timeLeft: number = 0;
  private grid!: Phaser.GameObjects.Grid;
  private gameOverSprite?: Phaser.GameObjects.Sprite;
  private restartButton?: Phaser.GameObjects.Text;
  private countdownText?: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  
  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private lastDirection: string = 'right';
  private canChangeDirection: boolean = true;
  
  // Event handlers
  private gameStateUpdatedBound!: (gameState: SnakeGameState) => void;
  private gameEndedBound!: (gameState: SnakeGameState) => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData) {
    this.gameId = data.gameId;
    this.playerName = data.playerName;
    this.isGameOver = false;
  }
  
  create() {
    // Setup background
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0, 0);
    
    // Create grid for visual reference
    this.createGrid();
    
    // Set up keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Add timer text
    this.timerText = this.add.text(
      this.scale.width / 2,
      20,
      'Time: 3:00',
      {
        fontSize: '24px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5, 0);
    
    // Register event handlers
    this.setupEventHandlers();
    
    // Fetch initial game state
    this.fetchGameState();
    
    // Start the countdown
    this.startCountdown();
  }
  
  update() {
    if (this.isGameOver || !this.gameState || !this.gameState.isActive) {
      return;
    }
    
    // Handle keyboard input for direction changes
    this.handleInput();
  }
  
  private createGrid() {
    // Create a grid pattern on the background
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.8);
    
    // Draw vertical lines
    for (let x = 0; x <= this.scale.width; x += this.gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.scale.height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= this.scale.height; y += this.gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.scale.width, y);
    }
    
    graphics.strokePath();
  }
  
  private setupEventHandlers() {
    // Store bound methods for cleanup
    this.gameStateUpdatedBound = this.onGameStateUpdated.bind(this);
    this.gameEndedBound = this.onGameEnded.bind(this);
    
    // Register handlers
    snakeGameService.onGameStateUpdated(this.gameStateUpdatedBound);
    snakeGameService.onGameEnded(this.gameEndedBound);
  }
  
  private async fetchGameState() {
    try {
      const gameState = await snakeGameService.getGame(this.gameId);
      if (gameState) {
        this.updateGameState(gameState);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  }
  
  private startCountdown() {
    // Create countdown text
    this.countdownText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      '3',
      {
        fontSize: '64px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Animate countdown
    this.tweens.add({
      targets: this.countdownText,
      scale: { from: 2, to: 1 },
      duration: 1000,
      onComplete: () => {
        this.countdownText!.setText('2');
        this.tweens.add({
          targets: this.countdownText,
          scale: { from: 2, to: 1 },
          duration: 1000,
          onComplete: () => {
            this.countdownText!.setText('1');
            this.tweens.add({
              targets: this.countdownText,
              scale: { from: 2, to: 1 },
              duration: 1000,
              onComplete: () => {
                this.countdownText!.setText('GO!');
                this.tweens.add({
                  targets: this.countdownText,
                  scale: { from: 1, to: 3 },
                  alpha: { from: 1, to: 0 },
                  duration: 1000,
                  onComplete: () => {
                    this.countdownText!.destroy();
                    this.countdownText = undefined;
                  }
                });
              }
            });
          }
        });
      }
    });
  }
  
  private onGameStateUpdated(gameState: SnakeGameState) {
    this.updateGameState(gameState);
  }
  
  private updateGameState(gameState: SnakeGameState) {
    this.gameState = gameState;
    
    // Find my connection ID if not already set
    if (!this.myConnectionId) {
      for (const [connectionId, player] of Object.entries(gameState.players)) {
        if (player.name === this.playerName) {
          this.myConnectionId = connectionId;
          break;
        }
      }
    }
    
    // Update timer
    if (gameState.isActive) {
      const now = new Date();
      const lastUpdate = new Date(gameState.lastUpdate);
      const elapsedSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      this.timeLeft = Math.max(0, gameState.gameDuration - elapsedSeconds);
      
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }
    
    // Update snakes
    this.updateSnakes(gameState);
    
    // Update flies
    this.updateFlies(gameState.flies);
    
    // Update scores
    this.updateScores(gameState);
  }
  
  private updateSnakes(gameState: SnakeGameState) {
    // Remove snakes that are no longer in the game
    for (const [connectionId, sprites] of this.snakeSprites.entries()) {
      if (!gameState.players[connectionId]) {
        sprites.destroy(true);
        this.snakeSprites.delete(connectionId);
      }
    }
    
    // Update or create snakes for all players
    for (const [connectionId, player] of Object.entries(gameState.players)) {
      // Destroy existing sprites if body length has changed
      if (this.snakeSprites.has(connectionId)) {
        const sprites = this.snakeSprites.get(connectionId)!;
        if (sprites.getLength() !== player.snakeBody.length) {
          sprites.destroy(true);
          this.snakeSprites.delete(connectionId);
        }
      }
      
      // Create new snake sprites if needed
      if (!this.snakeSprites.has(connectionId) && player.snakeBody.length > 0) {
        const sprites = this.add.group();
        
        // Create sprites for each body segment
        player.snakeBody.forEach((segment, index) => {
          const sprite = this.add.sprite(
            segment.x * this.gridSize + this.gridSize / 2,
            segment.y * this.gridSize + this.gridSize / 2,
            index === 0 ? 'snake-head' : 'snake-body'
          );
          
          // Tint the snake based on player color
          sprite.setTint(this.parseColor(player.color));
          
          sprites.add(sprite);
        });
        
        this.snakeSprites.set(connectionId, sprites);
      }
      
      // Update existing snake positions
      if (this.snakeSprites.has(connectionId)) {
        const sprites = this.snakeSprites.get(connectionId)!;
        sprites.getChildren().forEach((sprite, index) => {
          const segment = player.snakeBody[index];
          if (segment) {
            const spriteObj = sprite as Phaser.GameObjects.Sprite;
            spriteObj.setPosition(
              segment.x * this.gridSize + this.gridSize / 2,
              segment.y * this.gridSize + this.gridSize / 2
            );
            
            // Update head rotation based on direction
            if (index === 0) {
              if (player.direction === 'up') {
                spriteObj.setAngle(-90);
              } else if (player.direction === 'down') {
                spriteObj.setAngle(90);
              } else if (player.direction === 'left') {
                spriteObj.setAngle(180);
              } else if (player.direction === 'right') {
                spriteObj.setAngle(0);
              }
            }
          }
        });
      }
    }
  }
  
  private updateFlies(flies: Point[]) {
    // Remove extra fly sprites
    while (this.flySprites.length > flies.length) {
      const sprite = this.flySprites.pop();
      if (sprite) {
        sprite.destroy();
      }
    }
    
    // Add new fly sprites if needed
    while (this.flySprites.length < flies.length) {
      const sprite = this.add.sprite(0, 0, 'fly');
      sprite.play('fly');
      this.flySprites.push(sprite);
    }
    
    // Update fly positions
    flies.forEach((fly, index) => {
      this.flySprites[index].setPosition(
        fly.x * this.gridSize + this.gridSize / 2,
        fly.y * this.gridSize + this.gridSize / 2
      );
    });
  }
  
  private updateScores(gameState: SnakeGameState) {
    // Remove score texts for players that are no longer in the game
    for (const [connectionId, text] of this.scoreTexts.entries()) {
      if (!gameState.players[connectionId]) {
        text.destroy();
        this.scoreTexts.delete(connectionId);
      }
    }
    
    // Update or create score texts for all players
    let index = 0;
    
    // Create array of players with scores sorted in descending order
    interface PlayerWithInfo {
      id: string;
      name: string;
      score: number;
    }
    
    const sortedPlayers: PlayerWithInfo[] = [];
    
    for (const [id, player] of Object.entries(gameState.players)) {
      sortedPlayers.push({
        id,
        name: player.name,
        score: player.score
      });
    }
    
    sortedPlayers.sort((a, b) => b.score - a.score);
    
    sortedPlayers.forEach(player => {
      const x = 10;
      const y = 10 + index * 25;
      const isMe = player.id === this.myConnectionId;
      const displayName = isMe ? `${player.name} (You)` : player.name;
      
      if (this.scoreTexts.has(player.id)) {
        // Update existing text
        const text = this.scoreTexts.get(player.id)!;
        text.setText(`${displayName}: ${player.score}`);
        text.setPosition(x, y);
      } else {
        // Create new text
        const text = this.add.text(
          x,
          y,
          `${displayName}: ${player.score}`,
          {
            fontSize: '16px',
            color: isMe ? '#00FF00' : '#FFFFFF',
            fontStyle: isMe ? 'bold' : 'normal'
          }
        ).setOrigin(0, 0);
        
        this.scoreTexts.set(player.id, text);
      }
      
      index++;
    });
  }
  
  private handleInput() {
    if (!this.canChangeDirection || !this.myConnectionId) return;
    
    // Get current direction
    const currentDirection = this.gameState?.players[this.myConnectionId]?.direction || 'right';
    
    let newDirection = currentDirection;
    
    if (this.cursors.up.isDown && currentDirection !== 'down') {
      newDirection = 'up';
    } else if (this.cursors.down.isDown && currentDirection !== 'up') {
      newDirection = 'down';
    } else if (this.cursors.left.isDown && currentDirection !== 'right') {
      newDirection = 'left';
    } else if (this.cursors.right.isDown && currentDirection !== 'left') {
      newDirection = 'right';
    }
    
    // Send direction update if it has changed
    if (newDirection !== currentDirection) {
      this.canChangeDirection = false;
      
      snakeGameService.updateDirection(newDirection, this.gameId)
        .catch(error => console.error('Error updating direction:', error));
      
      // Allow next direction change after a short delay
      this.time.delayedCall(100, () => {
        this.canChangeDirection = true;
      });
    }
  }
  
  private onGameEnded(gameState: SnakeGameState) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    
    // Show game over screen
    this.showGameOver(gameState);
  }
  
  private showGameOver(gameState: SnakeGameState) {
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(
      0, 0, this.scale.width, this.scale.height,
      0x000000, 0.7
    ).setOrigin(0);
    
    // Add game over title
    this.add.image(
      this.scale.width / 2,
      this.scale.height / 4,
      'game-over'
    ).setOrigin(0.5);
    
    // Sort players by score
    const sortedPlayers = Object.values(gameState.players)
      .sort((a, b) => b.score - a.score);
    
    // Display winner
    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 40,
      'Final Scores',
      {
        fontSize: '28px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Display scores
    sortedPlayers.forEach((player, index) => {
      const isMe = player.name === this.playerName;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      
      this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + (index * 30),
        `${medal} ${player.name}${isMe ? ' (You)' : ''}: ${player.score}`,
        {
          fontSize: '20px',
          color: isMe ? '#00FF00' : '#FFFFFF',
          fontStyle: isMe ? 'bold' : 'normal'
        }
      ).setOrigin(0.5);
    });
    
    // Add back to lobby button
    this.restartButton = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.8,
      'Back to Menu',
      {
        fontSize: '24px',
        color: '#FFFFFF',
        backgroundColor: '#006600',
        padding: { left: 15, right: 15, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.restartButton?.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.restartButton?.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => {
        // Disconnect from the game
        snakeGameService.disconnect()
          .then(() => {
            // Go back to menu
            this.scene.start('MenuScene');
          })
          .catch(error => {
            console.error('Error disconnecting:', error);
            this.scene.start('MenuScene');
          });
      });
  }
  
  private parseColor(colorStr: string): number {
    return parseInt(colorStr.replace('#', '0x'));
  }
  
  shutdown() {
    // Remove event handlers
    if (this.gameStateUpdatedBound) {
      snakeGameService.offGameStateUpdated(this.gameStateUpdatedBound);
    }
    if (this.gameEndedBound) {
      snakeGameService.offGameEnded(this.gameEndedBound);
    }
  }
} 