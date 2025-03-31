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
  private snakes: { [connectionId: string]: { 
    segments: Phaser.GameObjects.Graphics[];
    connectionId: string;
  }} = {};
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
    this.setupKeyboardInput();
    
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
  
  private setupKeyboardInput() {
    // Create cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Add additional key handlers for improved responsiveness
    this.input.keyboard!.on('keydown-UP', () => {
      this.processDirectionChange('up');
    });
    
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.processDirectionChange('down');
    });
    
    this.input.keyboard!.on('keydown-LEFT', () => {
      this.processDirectionChange('left');
    });
    
    this.input.keyboard!.on('keydown-RIGHT', () => {
      this.processDirectionChange('right');
    });
    
    // Add WASD keys for alternative control
    this.input.keyboard!.on('keydown-W', () => {
      this.processDirectionChange('up');
    });
    
    this.input.keyboard!.on('keydown-S', () => {
      this.processDirectionChange('down');
    });
    
    this.input.keyboard!.on('keydown-A', () => {
      this.processDirectionChange('left');
    });
    
    this.input.keyboard!.on('keydown-D', () => {
      this.processDirectionChange('right');
    });
    
    console.log('GameScene: Keyboard input initialized');
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
    
    console.log('GameScene: Event handlers registered');
  }
  
  private async fetchGameState() {
    try {
      console.log('GameScene: Fetching initial game state for game ID:', this.gameId);
      const gameState = await snakeGameService.getGame(this.gameId);
      if (gameState) {
        console.log('GameScene: Initial game state received:', JSON.stringify(gameState));
        
        // Force log of all players and their snakes
        console.log('Initial players:');
        Object.entries(gameState.players).forEach(([connectionId, player]) => {
          console.log(`Player ${player.name} (${connectionId}): Snake body length ${player.snakeBody.length}`);
        });
        
        this.updateGameState(gameState);
      } else {
        console.error('GameScene: Game not found');
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
    console.log('GameScene: Game state updated');
    this.updateGameState(gameState);
  }
  
  private updateGameState(gameState: SnakeGameState) {
    console.log('Updating game state:', gameState);
    this.gameState = gameState;
    
    // Find my connection ID if not already set
    if (!this.myConnectionId) {
      for (const [connectionId, player] of Object.entries(gameState.players)) {
        if (player.name === this.playerName) {
          this.myConnectionId = connectionId;
          console.log('Found my connection ID:', this.myConnectionId);
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
    this.updateSnakes();
    
    // Update flies
    this.updateFlies(gameState.flies);
    
    // Update scores
    this.updateScores(gameState);
  }
  
  private updateSnakes() {
    if (!this.gameState) return;

    console.log(`Updating snakes for ${Object.keys(this.gameState.players).length} players`);
    
    // Loop through all players
    Object.entries(this.gameState.players).forEach(([connectionId, player]) => {
      console.log(`Processing player ${player.name} (${connectionId}), snake length: ${player.snakeBody?.length}`);
      
      // Skip if player has no snake body
      if (!player.snakeBody || player.snakeBody.length === 0) {
        console.log(`Player ${player.name} has no snake body, skipping rendering`);
        return;
      }
      
      // Get or create snake container for this player
      if (!this.snakes[connectionId]) {
        this.snakes[connectionId] = {
          segments: [],
          connectionId: connectionId
        };
        console.log(`Created new snake container for player ${player.name}`);
      }
      
      const snake = this.snakes[connectionId];
      const isCurrentPlayer = connectionId === this.myConnectionId;
      const colorValue = player.color || (isCurrentPlayer ? 0x00ff00 : 0xff0000);
      const color = typeof colorValue === 'string' ? parseInt(colorValue.replace('#', '0x'), 16) : colorValue;
      
      console.log(`Player ${player.name} snake color: ${color}, is current player: ${isCurrentPlayer}`);
      
      // Calculate segment size based on board dimensions
      const cellSize = this.calculateCellSize();
      
      // Update or create snake segments
      for (let i = 0; i < player.snakeBody.length; i++) {
        const segment = player.snakeBody[i];
        
        if (!segment) {
          console.warn(`Missing segment at index ${i} for player ${player.name}`);
          continue;
        }
        
        // Calculate position
        const x = segment.x * cellSize + cellSize / 2;
        const y = segment.y * cellSize + cellSize / 2;
        
        // Check if segment already exists
        if (i < snake.segments.length) {
          // Update existing segment
          const graphics = snake.segments[i];
          graphics.clear();
          graphics.fillStyle(color, 1);
          graphics.fillRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
          graphics.setPosition(x, y);
          graphics.setVisible(true);
          graphics.setDepth(10); // Ensure snake is above background
          
          if (i === 0) {
            // Add eyes to the head
            const eyeSize = cellSize / 5;
            const eyeOffset = cellSize / 4;
            graphics.fillStyle(0x000000, 1);
            
            // Direction-based eye positioning
            switch (player.direction) {
              case 'up':
                graphics.fillCircle(-eyeOffset, -eyeOffset, eyeSize);
                graphics.fillCircle(eyeOffset, -eyeOffset, eyeSize);
                break;
              case 'down':
                graphics.fillCircle(-eyeOffset, eyeOffset, eyeSize);
                graphics.fillCircle(eyeOffset, eyeOffset, eyeSize);
                break;
              case 'left':
                graphics.fillCircle(-eyeOffset, -eyeOffset, eyeSize);
                graphics.fillCircle(-eyeOffset, eyeOffset, eyeSize);
                break;
              case 'right':
                graphics.fillCircle(eyeOffset, -eyeOffset, eyeSize);
                graphics.fillCircle(eyeOffset, eyeOffset, eyeSize);
                break;
            }
          }
          
          console.log(`Updated segment ${i} for player ${player.name} at (${x}, ${y})`);
        } else {
          // Create new segment
          const graphics = this.add.graphics();
          graphics.fillStyle(color, 1);
          graphics.fillRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
          graphics.setPosition(x, y);
          graphics.setVisible(true);
          graphics.setDepth(10); // Ensure snake is above background
          
          if (i === 0) {
            // Add eyes to the head
            const eyeSize = cellSize / 5;
            const eyeOffset = cellSize / 4;
            graphics.fillStyle(0x000000, 1);
            
            // Direction-based eye positioning
            switch (player.direction) {
              case 'up':
                graphics.fillCircle(-eyeOffset, -eyeOffset, eyeSize);
                graphics.fillCircle(eyeOffset, -eyeOffset, eyeSize);
                break;
              case 'down':
                graphics.fillCircle(-eyeOffset, eyeOffset, eyeSize);
                graphics.fillCircle(eyeOffset, eyeOffset, eyeSize);
                break;
              case 'left':
                graphics.fillCircle(-eyeOffset, -eyeOffset, eyeSize);
                graphics.fillCircle(-eyeOffset, eyeOffset, eyeSize);
                break;
              case 'right':
                graphics.fillCircle(eyeOffset, -eyeOffset, eyeSize);
                graphics.fillCircle(eyeOffset, eyeOffset, eyeSize);
                break;
            }
          }
          
          snake.segments.push(graphics);
          console.log(`Created new segment ${i} for player ${player.name} at (${x}, ${y})`);
        }
      }
      
      // Remove extra segments if snake is now shorter
      if (snake.segments.length > player.snakeBody.length) {
        console.log(`Removing ${snake.segments.length - player.snakeBody.length} extra segments for player ${player.name}`);
        
        for (let i = player.snakeBody.length; i < snake.segments.length; i++) {
          snake.segments[i].destroy();
        }
        
        snake.segments.splice(player.snakeBody.length);
      }
    });
    
    // Remove snakes for players who are no longer in the game
    Object.keys(this.snakes).forEach(connectionId => {
      if (!this.gameState!.players[connectionId]) {
        console.log(`Removing snake for player ${connectionId} who left the game`);
        
        // Destroy all segments
        this.snakes[connectionId].segments.forEach(segment => {
          segment.destroy();
        });
        
        // Remove from snakes object
        delete this.snakes[connectionId];
      }
    });
  }
  
  private calculateCellSize(): number {
    const boardWidth = this.gameState?.boardWidth || 25;
    const boardHeight = this.gameState?.boardHeight || 25;
    
    // Calculate cell size based on game dimensions
    const cellSizeX = this.scale.width / boardWidth;
    const cellSizeY = this.scale.height / boardHeight;
    
    // Return the smaller of the two to ensure cells fit within the game area
    return Math.min(cellSizeX, cellSizeY);
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
    if (!this.canChangeDirection || !this.myConnectionId || !this.gameState?.isActive) return;
    
    // Get current direction
    const currentPlayer = this.gameState?.players[this.myConnectionId];
    if (!currentPlayer) return;
    
    const currentDirection = currentPlayer.direction || 'right';
    
    let newDirection = currentDirection;
    
    // Check for key presses
    if (this.cursors.up.isDown && currentDirection !== 'down') {
      newDirection = 'up';
    } else if (this.cursors.down.isDown && currentDirection !== 'up') {
      newDirection = 'down';
    } else if (this.cursors.left.isDown && currentDirection !== 'right') {
      newDirection = 'left';
    } else if (this.cursors.right.isDown && currentDirection !== 'left') {
      newDirection = 'right';
    }
    
    // If direction changed, process it
    if (newDirection !== currentDirection) {
      this.processDirectionChange(newDirection);
    }
  }
  
  private processDirectionChange(newDirection: string) {
    if (!this.canChangeDirection || !this.myConnectionId || !this.gameState?.isActive) return;
    
    // Get current direction
    const currentPlayer = this.gameState?.players[this.myConnectionId];
    if (!currentPlayer) return;
    
    const currentDirection = currentPlayer.direction || 'right';
    
    // Validate the direction change (prevent 180-degree turns)
    if ((newDirection === 'up' && currentDirection === 'down') ||
        (newDirection === 'down' && currentDirection === 'up') ||
        (newDirection === 'left' && currentDirection === 'right') ||
        (newDirection === 'right' && currentDirection === 'left')) {
      return;
    }
    
    // Only send update if direction changed
    if (newDirection !== currentDirection) {
      console.log(`Changing direction from ${currentDirection} to ${newDirection}`);
      
      // Prevent rapid direction changes
      this.canChangeDirection = false;
      
      // Update local player direction immediately for responsiveness
      if (this.gameState && this.myConnectionId && this.gameState.players[this.myConnectionId]) {
        this.gameState.players[this.myConnectionId].direction = newDirection;
      }
      
      // Send direction update to server
      snakeGameService.updateDirection(newDirection, this.gameId)
        .then(() => {
          console.log(`Direction update sent: ${newDirection}`);
        })
        .catch(error => {
          console.error('Error updating direction:', error);
        })
        .finally(() => {
          // Allow direction changes again after a short delay
          this.time.delayedCall(100, () => {
            this.canChangeDirection = true;
          });
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
    // Remove the # if it exists
    if (colorStr.startsWith('#')) {
      colorStr = colorStr.substring(1);
    }
    
    // Default to green if invalid color
    if (!/^[0-9A-Fa-f]{6}$/.test(colorStr)) {
      console.warn(`Invalid color format: ${colorStr}, using default green`);
      return 0x00FF00;
    }
    
    // Parse the color string to a number
    return parseInt(colorStr, 16);
  }
  
  shutdown() {
    console.log('GameScene: Shutting down, cleaning up resources');
    
    // Remove event handlers
    snakeGameService.offGameStateUpdated(this.gameStateUpdatedBound);
    snakeGameService.offGameEnded(this.gameEndedBound);
    
    // Clean up all snake graphics
    Object.values(this.snakes).forEach(snake => {
      snake.segments.forEach(segment => {
        segment.destroy();
      });
    });
    
    // Clear snake references
    this.snakes = {};
    
    // Clean up fly sprites
    this.flySprites.forEach(sprite => {
      sprite.destroy();
    });
    this.flySprites = [];
    
    // Clean up score texts
    this.scoreTexts.forEach(text => {
      text.destroy();
    });
    this.scoreTexts.clear();
    
    // Clean up other text elements
    if (this.timerText) {
      this.timerText.destroy();
    }
    
    if (this.countdownText) {
      this.countdownText.destroy();
    }
    
    if (this.gameOverSprite) {
      this.gameOverSprite.destroy();
    }
    
    if (this.restartButton) {
      this.restartButton.destroy();
    }
    
    console.log('GameScene: Cleanup complete');
  }
} 