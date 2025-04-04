import Phaser from 'phaser';
import snakeGameService from '../../../services/SnakeGameService';
import LobbyScene from './LobbyScene';

export default class MenuScene extends Phaser.Scene {
  private playerName: string = '';
  private gameId: string = '';
  private isJoining: boolean = false;
  
  // UI elements
  private hostButton!: Phaser.GameObjects.Container;
  private joinButton!: Phaser.GameObjects.Container;
  private backButton!: Phaser.GameObjects.Container;
  private nameDisplay!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private gameIdInput!: Phaser.GameObjects.Text;
  
  // Dialog elements
  private inputPanel!: Phaser.GameObjects.Container;
  private inputField!: Phaser.GameObjects.Text;
  private inputMode: 'name' | 'gameId' = 'name';
  private inputValue: string = '';
  
  constructor() {
    super({ key: 'MenuScene' });
  }
  
  create() {
    // Set background
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0, 0);
    
    // Add title
    this.add.text(
      this.scale.width / 2,
      100,
      'Multiplayer Snake Game',
      {
        fontSize: '36px',
        color: '#FFFFFF',
        fontFamily: 'monospace'
      }
    ).setOrigin(0.5);
    
    // Create loading animation
    this.anims.create({
      key: 'loading',
      frames: this.anims.generateFrameNumbers('loading', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Create error text (initially hidden)
    this.errorText = this.add.text(
      this.scale.width / 2,
      this.scale.height - 50,
      '',
      {
        fontSize: '18px',
        color: '#FF0000',
        backgroundColor: '#330000',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    ).setOrigin(0.5).setVisible(false);
    
    // Create main menu UI
    this.createMainMenu();
    
    // Create name input field (shown by default)
    this.showNameInput();
  }
  
  private createMainMenu() {
    // Name display
    const nameLabel = this.add.text(
      this.scale.width / 2,
      180,
      'Your Name:',
      {
        fontSize: '20px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5);
    
    // Name field background
    const nameBackground = this.add.rectangle(
      this.scale.width / 2,
      220,
      300,
      40,
      0x333333
    ).setOrigin(0.5).setStrokeStyle(2, 0x00ff00);
    
    // Name display field (will show current name)
    this.nameDisplay = this.add.text(
      this.scale.width / 2,
      220,
      this.playerName || 'Click to enter name',
      {
        fontSize: '20px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5);
    
    // Make name field clickable
    const nameInputZone = this.add.zone(
      this.scale.width / 2,
      220,
      300,
      40
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    nameInputZone.on('pointerdown', () => {
      this.showNameInput();
    });
    
    // Host Game button
    this.hostButton = this.createButton(
      this.scale.width / 2,
      320,
      'Host New Game',
      0x00aa00,
      0x00ff00,
      () => this.hostGame()
    );
    
    // Join Game button
    this.joinButton = this.createButton(
      this.scale.width / 2,
      400,
      'Join Game',
      0x0000aa,
      0x0000ff,
      () => this.showJoinGameUI()
    );
  }
  
  private createButton(x: number, y: number, text: string, color: number, hoverColor: number, callback: () => void): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);
    
    // Button background
    const background = this.add.rectangle(0, 0, 240, 60, color)
      .setInteractive({ useHandCursor: true });
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    
    // Add elements to container
    button.add([background, buttonText]);
    
    // Button events
    background.on('pointerover', () => {
      background.setFillStyle(hoverColor);
    });
    
    background.on('pointerout', () => {
      background.setFillStyle(color);
    });
    
    background.on('pointerdown', callback);
    
    return button;
  }
  
  private showNameInput() {
    // Store initial value
    this.inputValue = this.playerName || '';
    this.inputMode = 'name';
    
    // Show input panel
    this.showInputPanel('Enter Your Name', this.inputValue, (value) => {
      if (value) {
        this.playerName = value;
        this.nameDisplay.setText(value);
      }
    });
  }
  
  private showJoinGameUI() {
    this.isJoining = true;
    
    // Hide main menu buttons
    this.hostButton.setVisible(false);
    this.joinButton.setVisible(false);
    
    // Create back button if not exists
    if (!this.backButton) {
      this.backButton = this.createButton(
        this.scale.width / 2,
        480,
        'Back',
        0x555555,
        0x777777,
        () => this.showMainMenu()
      );
    } else {
      this.backButton.setVisible(true);
    }
    
    // Create game ID input
    this.inputMode = 'gameId';
    this.inputValue = '';
    
    // Show input panel
    this.showInputPanel('Enter Game ID', '', (value) => {
      if (value) {
        this.gameId = value;
        this.joinGame();
      }
    });
  }
  
  private showMainMenu() {
    this.isJoining = false;
    
    // Show main menu buttons
    this.hostButton.setVisible(true);
    this.joinButton.setVisible(true);
    
    // Hide back button
    if (this.backButton) {
      this.backButton.setVisible(false);
    }
    
    // Hide any input panel
    if (this.inputPanel) {
      this.inputPanel.setVisible(false);
    }
    
    // Hide error text
    this.hideError();
  }
  
  private showInputPanel(title: string, initialValue: string, onSubmit: (value: string) => void) {
    // Remove existing panel if it exists
    if (this.inputPanel) {
      this.inputPanel.destroy();
    }
    
    // Create panel container
    this.inputPanel = this.add.container(this.scale.width / 2, 300);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 400, 200, 0x333333)
      .setStrokeStyle(2, 0x00ff00);
    
    // Title text
    const titleText = this.add.text(0, -70, title, {
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    
    // Input field background
    const inputBackground = this.add.rectangle(0, 0, 300, 40, 0x000000)
      .setStrokeStyle(1, 0xffffff);
    
    // Input text field
    this.inputValue = initialValue;
    this.inputField = this.add.text(-140, -15, this.inputValue, {
      fontSize: '20px',
      color: '#FFFFFF'
    }).setOrigin(0, 0);
    
    // Cursor/caret for text input
    const cursor = this.add.rectangle(
      this.inputField.x + this.inputField.width + 2,
      this.inputField.y + this.inputField.height / 2,
      2,
      24,
      0xffffff
    ).setOrigin(0, 0.5);
    
    // Make cursor blink
    this.tweens.add({
      targets: cursor,
      alpha: 0,
      duration: 500,
      ease: 'Power1',
      yoyo: true,
      repeat: -1
    });
    
    // Add paste button (clipboard icon) for game ID input
    if (this.inputMode === 'gameId') {
      const pasteButton = this.add.rectangle(
        140, // Position to the right of the input field
        0,
        36,
        36,
        0x555555
      ).setStrokeStyle(1, 0xffffff);
      
      pasteButton.setInteractive({ useHandCursor: true });
      
      // Clipboard icon (simplified)
      const clipboardIcon = this.add.text(
        140,
        0,
        "📋", // Unicode clipboard icon
        {
          fontSize: '20px'
        }
      ).setOrigin(0.5);
      
      // Paste functionality
      pasteButton.on('pointerover', () => {
        pasteButton.setFillStyle(0x777777);
      });
      
      pasteButton.on('pointerout', () => {
        pasteButton.setFillStyle(0x555555);
      });
      
      pasteButton.on('pointerdown', async () => {
        try {
          // Use clipboard API to get text
          const text = await navigator.clipboard.readText();
          
          // Trim and validate text (for game IDs we typically want alphanumeric content)
          const validText = text.trim().substring(0, 8); // Limit to 8 characters
          
          // Set the input value
          this.inputValue = validText;
          this.inputField.setText(this.inputValue);
          
          // Update cursor position
          cursor.setPosition(this.inputField.x + this.inputField.width + 2, cursor.y);
        } catch (error) {
          console.error('Failed to read clipboard contents:', error);
          this.showError('Could not access clipboard. Try manually typing the Game ID.');
        }
      });
      
      // Add paste button to panel
      this.inputPanel.add([pasteButton, clipboardIcon]);
    }
    
    // Submit button
    const submitButton = this.createButton(0, 70, 'Submit', 0x00aa00, 0x00ff00, () => {
      onSubmit(this.inputValue);
      this.inputPanel.setVisible(false);
    });
    
    // Add all elements to the panel
    this.inputPanel.add([panel, titleText, inputBackground, this.inputField, cursor, submitButton]);
    
    // Set up keyboard input
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown'); // Remove any existing listeners
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        // Clipboard paste operation (Ctrl+V or Command+V)
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
          // Prevent default to avoid competing with our clipboard handler
          event.preventDefault();
          
          // Use clipboard API
          navigator.clipboard.readText()
            .then(text => {
              // Handle the pasted text based on input mode
              if (this.inputMode === 'gameId') {
                const validText = text.trim().substring(0, 8);
                this.inputValue = validText;
              } else {
                // For name input, limit to 15 characters
                const validText = text.trim().substring(0, 15);
                this.inputValue = validText;
              }
              
              // Update the text field
              this.inputField.setText(this.inputValue);
              cursor.setPosition(this.inputField.x + this.inputField.width + 2, cursor.y);
            })
            .catch(err => {
              console.error('Failed to read clipboard:', err);
            });
            
          return;
        }
        
        if (event.key === 'Enter') {
          // Submit on Enter
          onSubmit(this.inputValue);
          this.inputPanel.setVisible(false);
        } else if (event.key === 'Escape') {
          // Cancel on Escape
          this.inputPanel.setVisible(false);
        } else if (event.key === 'Backspace') {
          // Handle backspace
          if (this.inputValue.length > 0) {
            this.inputValue = this.inputValue.slice(0, -1);
            this.inputField.setText(this.inputValue);
            cursor.setPosition(this.inputField.x + this.inputField.width + 2, cursor.y);
          }
        } else if (event.key.length === 1) {
          // Add character to input
          if (this.inputMode === 'gameId' && this.inputValue.length < 8) {
            this.inputValue += event.key;
            this.inputField.setText(this.inputValue);
            cursor.setPosition(this.inputField.x + this.inputField.width + 2, cursor.y);
          } else if (this.inputMode === 'name' && this.inputValue.length < 15) {
            this.inputValue += event.key;
            this.inputField.setText(this.inputValue);
            cursor.setPosition(this.inputField.x + this.inputField.width + 2, cursor.y);
          }
        }
      });
    }
  }
  
  private async hostGame() {
    if (!this.playerName) {
      this.showError('Please enter your name first!');
      this.showNameInput();
      return;
    }
    
    this.hideError();
    
    // Disable buttons
    const hostButtonBg = this.hostButton.getAll()[0] as Phaser.GameObjects.Rectangle;
    const joinButtonBg = this.joinButton.getAll()[0] as Phaser.GameObjects.Rectangle;
    
    if (hostButtonBg) hostButtonBg.disableInteractive();
    if (joinButtonBg) joinButtonBg.disableInteractive();
    
    // Show status message
    const statusText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.6,
      'Connecting to server...',
      {
        fontSize: '18px',
        color: '#FFFF00'
      }
    ).setOrigin(0.5);
    
    try {
      // Connect to SignalR hub
      await snakeGameService.connect();
      
      statusText.setText('Creating new game...');
      
      // Create a new game
      const gameState = await snakeGameService.createGame({
        playerName: this.playerName,
        settings: {
          boardWidth: 40,
          boardHeight: 30,
          initialSnakeLength: 3,
          maxPlayers: 4,
          gameDuration: 30,
          flyCount: 5
        }
      });
      
      console.log('Game created:', gameState);
      
      // Store created game ID
      this.gameId = gameState.gameId;
      
      // Start the Lobby scene
      this.scene.start('LobbyScene', {
        gameId: this.gameId,
        playerName: this.playerName,
        isHost: true
      });
    } catch (error) {
      console.error('Error in hostGame:', error);
      this.showError('Failed to create game. Try again!');
      
      // Re-enable buttons
      if (hostButtonBg) hostButtonBg.setInteractive({ useHandCursor: true });
      if (joinButtonBg) joinButtonBg.setInteractive({ useHandCursor: true });
      
      // Remove status text
      statusText.destroy();
    }
  }
  
  private async joinGame() {
    if (!this.playerName) {
      this.showError('Please enter your name first!');
      this.showNameInput();
      return;
    }
    
    if (!this.gameId) {
      this.showError('Please enter a game ID!');
      return;
    }
    
    this.hideError();
    
    // Disable buttons
    if (this.backButton) {
      const backButtonBg = this.backButton.getAll()[0] as Phaser.GameObjects.Rectangle;
      if (backButtonBg) backButtonBg.disableInteractive();
    }
    
    // Show status text
    const statusText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.6,
      'Connecting to server...',
      {
        fontSize: '18px',
        color: '#FFFF00'
      }
    ).setOrigin(0.5);
    
    try {
      // Connect to SignalR hub
      await snakeGameService.connect();
      
      statusText.setText('Joining game...');
      
      // Join the game
      const result = await snakeGameService.joinGame({
        gameId: this.gameId,
        playerName: this.playerName
      });
      
      if (result) {
        // Get game state
        const gameState = await snakeGameService.getGame(this.gameId);
        
        if (gameState) {
          // Start the Lobby scene
          this.scene.start('LobbyScene', {
            gameId: this.gameId,
            playerName: this.playerName,
            isHost: false
          });
        } else {
          this.showError('Game not found. Check the Game ID!');
          
          // Re-enable buttons
          if (this.backButton) {
            const backButtonBg = this.backButton.getAll()[0] as Phaser.GameObjects.Rectangle;
            if (backButtonBg) backButtonBg.setInteractive({ useHandCursor: true });
          }
          
          statusText.destroy();
        }
      } else {
        this.showError('Failed to join game. Check the Game ID!');
        
        // Re-enable buttons
        if (this.backButton) {
          const backButtonBg = this.backButton.getAll()[0] as Phaser.GameObjects.Rectangle;
          if (backButtonBg) backButtonBg.setInteractive({ useHandCursor: true });
        }
        
        statusText.destroy();
      }
    } catch (error) {
      console.error('Error in joinGame:', error);
      this.showError('Failed to join game. Try again!');
      
      // Re-enable buttons
      if (this.backButton) {
        const backButtonBg = this.backButton.getAll()[0] as Phaser.GameObjects.Rectangle;
        if (backButtonBg) backButtonBg.setInteractive({ useHandCursor: true });
      }
      
      statusText.destroy();
    }
  }
  
  private showError(message: string) {
    this.errorText.setText(message);
    this.errorText.setVisible(true);
    
    // Auto-hide after 5 seconds
    this.time.delayedCall(5000, () => {
      this.hideError();
    });
  }
  
  private hideError() {
    this.errorText.setVisible(false);
  }
  
  shutdown() {
    // Clean up event listeners
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown');
    }
  }
} 