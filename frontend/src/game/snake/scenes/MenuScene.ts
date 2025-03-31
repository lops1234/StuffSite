import Phaser from 'phaser';
import { snakeGameService } from '../../../services/SnakeGameService';

export default class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;
  private joinButton!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private nameInput!: HTMLInputElement;
  private gameIdInput!: HTMLInputElement;
  private isJoining: boolean = false;
  private playerName: string = '';
  private gameId: string = '';
  private submitNameButton!: Phaser.GameObjects.Text;
  private submitGameIdButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Check if player name already exists in local storage
    const savedName = localStorage.getItem('snakePlayerName');
    if (savedName) {
      this.playerName = savedName;
    }

    // Add background
    try {
      // Try to add the background image
      this.add.image(0, 0, 'background')
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);
    } catch (error) {
      console.error('Error adding background:', error);
      // Fallback: Just add a black rectangle if the image fails
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
        .setOrigin(0, 0);
    }

    // Add title text
    this.titleText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 5,
      'Multiplayer Snake Game',
      {
        fontSize: '32px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Add animation for title
    this.tweens.add({
      targets: this.titleText,
      scale: { from: 0.9, to: 1.1 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Create the player name input
    this.createNameInput();
    
    // Create submit name button
    this.createSubmitNameButton();

    // Create the start button
    this.startButton = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Host New Game',
      {
        fontSize: '24px',
        color: '#FFFFFF',
        backgroundColor: '#009900',
        padding: { left: 15, right: 15, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.startButton.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.startButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => this.hostGame());

    // Create the join button
    this.joinButton = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 70,
      'Join Game',
      {
        fontSize: '24px',
        color: '#FFFFFF',
        backgroundColor: '#000099',
        padding: { left: 15, right: 15, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.joinButton.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.joinButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => this.showJoinGameUI());

    // Hide game ID input initially
    this.createGameIdInput();
    this.gameIdInput.style.display = 'none';

    // Create back button (hidden initially)
    this.backButton = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 140,
      'Back',
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
      .on('pointerdown', () => this.showMainMenu())
      .setVisible(false);

    // Add a decorative element - animated fly
    const fly = this.add.sprite(
      this.scale.width * 0.8,
      this.scale.height * 0.3,
      'fly'
    ).play('fly');

    // Add animation for fly
    this.tweens.add({
      targets: fly,
      x: this.scale.width * 0.2,
      y: this.scale.height * 0.7,
      duration: 5000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createNameInput() {
    // Create a DOM element for name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter your name';
    nameInput.style.position = 'absolute';
    nameInput.style.left = '50%';
    nameInput.style.top = '40%';
    nameInput.style.transform = 'translate(-50%, -50%)';
    nameInput.style.padding = '8px';
    nameInput.style.width = '200px';
    nameInput.style.textAlign = 'center';
    nameInput.style.borderRadius = '4px';
    nameInput.style.border = '2px solid #00ff00';
    nameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    nameInput.style.color = '#ffffff';
    nameInput.style.fontSize = '16px';
    nameInput.value = this.playerName;
    
    // Add event listener for Enter key press
    nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.playerName = nameInput.value;
        localStorage.setItem('snakePlayerName', this.playerName);
        nameInput.blur(); // Remove focus from input to allow button interaction
      }
    });

    // Prevent input from capturing all events
    nameInput.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    // Add input to DOM
    document.body.appendChild(nameInput);
    this.nameInput = nameInput;

    // Store input value when it changes
    nameInput.oninput = () => {
      this.playerName = nameInput.value;
      localStorage.setItem('snakePlayerName', this.playerName);
    };
  }

  private createSubmitNameButton() {
    // Create a submit button for the name input
    this.submitNameButton = this.add.text(
      this.scale.width / 2 + 120,
      this.scale.height * 0.4,
      'Submit',
      {
        fontSize: '16px',
        color: '#FFFFFF',
        backgroundColor: '#00AA00',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    )
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.submitNameButton.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.submitNameButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => {
        if (this.nameInput) {
          this.playerName = this.nameInput.value;
          localStorage.setItem('snakePlayerName', this.playerName);
          this.nameInput.blur();
          this.showConfirmation('Name submitted!');
        }
      });
  }

  private createGameIdInput() {
    // Create a DOM element for game ID input
    const gameIdInput = document.createElement('input');
    gameIdInput.type = 'text';
    gameIdInput.placeholder = 'Enter Game ID';
    gameIdInput.style.position = 'absolute';
    gameIdInput.style.left = '50%';
    gameIdInput.style.top = '50%';
    gameIdInput.style.transform = 'translate(-50%, -50%)';
    gameIdInput.style.padding = '8px';
    gameIdInput.style.width = '200px';
    gameIdInput.style.textAlign = 'center';
    gameIdInput.style.borderRadius = '4px';
    gameIdInput.style.border = '2px solid #0000ff';
    gameIdInput.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    gameIdInput.style.color = '#ffffff';
    gameIdInput.style.fontSize = '16px';
    
    // Add event listener for Enter key press
    gameIdInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.gameId = gameIdInput.value;
        gameIdInput.blur(); // Remove focus from input to allow button interaction
      }
    });

    // Prevent input from capturing all events
    gameIdInput.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    // Add input to DOM
    document.body.appendChild(gameIdInput);
    this.gameIdInput = gameIdInput;

    // Store input value when it changes
    gameIdInput.oninput = () => {
      this.gameId = gameIdInput.value;
    };
  }

  private hostGame() {
    if (!this.playerName) {
      this.showError('Please enter your name first!');
      return;
    }

    try {
      this.startButton.setText('Connecting...');
      this.startButton.disableInteractive();
      this.joinButton.disableInteractive();

      // Ensure input doesn't interfere with game process
      if (this.nameInput) {
        this.nameInput.blur();
      }

      // Connect to the SignalR hub
      snakeGameService.connect()
        .then(() => {
          // Create a new game
          return snakeGameService.createGame({
            playerName: this.playerName,
            settings: {
              boardWidth: 25,
              boardHeight: 25,
              initialSnakeLength: 3,
              maxPlayers: 4,
              gameDuration: 180,
              flyCount: 5
            }
          });
        })
        .then(gameState => {
          // Store the game ID and pass to lobby
          this.gameId = gameState.gameId;
          
          // Clean up DOM elements
          this.cleanup();
          
          // Start the lobby scene
          this.scene.start('LobbyScene', {
            gameId: this.gameId,
            playerName: this.playerName,
            isHost: true
          });
        })
        .catch(error => {
          console.error('Error hosting game:', error);
          this.showError('Failed to create game. Try again!');
          this.startButton.setText('Host New Game');
          this.startButton.setInteractive({ useHandCursor: true });
          this.joinButton.setInteractive({ useHandCursor: true });
        });
    } catch (error) {
      console.error('Error in hostGame:', error);
      this.showError('Failed to create game. Try again!');
      this.startButton.setText('Host New Game');
      this.startButton.setInteractive({ useHandCursor: true });
      this.joinButton.setInteractive({ useHandCursor: true });
    }
  }

  private showJoinGameUI() {
    if (!this.playerName) {
      this.showError('Please enter your name first!');
      return;
    }

    // Switch to join game mode
    this.isJoining = true;
    
    // Show game ID input
    this.gameIdInput.style.display = 'block';
    
    // Create game ID submit button if it doesn't exist
    this.createGameIdSubmitButton();
    
    // Update button text and position
    this.startButton.setText('Join');
    this.startButton.setPosition(this.scale.width / 2, this.scale.height / 2 + 70);
    this.startButton.setInteractive().on('pointerdown', () => this.joinGame());
    
    // Hide join button
    this.joinButton.setVisible(false);
    
    // Show back button
    this.backButton.setVisible(true);
  }

  private showMainMenu() {
    // Switch back to main menu
    this.isJoining = false;
    
    // Hide game ID input
    this.gameIdInput.style.display = 'none';
    
    // Hide game ID submit button
    if (this.submitGameIdButton) {
      this.submitGameIdButton.setVisible(false);
    }
    
    // Reset buttons
    this.startButton.setText('Host New Game');
    this.startButton.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.startButton.setInteractive().on('pointerdown', () => this.hostGame());
    
    // Show join button
    this.joinButton.setVisible(true);
    
    // Hide back button
    this.backButton.setVisible(false);
  }

  private joinGame() {
    if (!this.gameId) {
      this.showError('Please enter a Game ID!');
      return;
    }

    try {
      this.startButton.setText('Joining...');
      this.startButton.disableInteractive();
      this.backButton.disableInteractive();

      // Ensure input doesn't interfere with game process
      if (this.nameInput) {
        this.nameInput.blur();
      }
      if (this.gameIdInput) {
        this.gameIdInput.blur();
      }

      // Connect to the SignalR hub
      snakeGameService.connect()
        .then(() => {
          // Join the game
          return snakeGameService.joinGame({
            gameId: this.gameId,
            playerName: this.playerName
          });
        })
        .then(success => {
          if (success) {
            // Clean up DOM elements
            this.cleanup();
            
            // Start the lobby scene
            this.scene.start('LobbyScene', {
              gameId: this.gameId,
              playerName: this.playerName,
              isHost: false
            });
          } else {
            this.showError('Failed to join game. Check the Game ID!');
            this.startButton.setText('Join');
            this.startButton.setInteractive({ useHandCursor: true });
            this.backButton.setInteractive({ useHandCursor: true });
          }
        })
        .catch(error => {
          console.error('Error joining game:', error);
          this.showError('Failed to join game. Try again!');
          this.startButton.setText('Join');
          this.startButton.setInteractive({ useHandCursor: true });
          this.backButton.setInteractive({ useHandCursor: true });
        });
    } catch (error) {
      console.error('Error in joinGame:', error);
      this.showError('Failed to join game. Try again!');
      this.startButton.setText('Join');
      this.startButton.setInteractive({ useHandCursor: true });
      this.backButton.setInteractive({ useHandCursor: true });
    }
  }

  private showError(message: string) {
    // Show error message
    const errorText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.8,
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

  private showConfirmation(message: string) {
    // Show confirmation message
    const confirmText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.8,
      message,
      {
        fontSize: '18px',
        color: '#00FF00',
        backgroundColor: '#000000',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    ).setOrigin(0.5);

    // Remove after a short time
    this.time.delayedCall(1500, () => {
      confirmText.destroy();
    });
  }

  private cleanup() {
    // Remove DOM elements
    if (this.nameInput) {
      document.body.removeChild(this.nameInput);
      this.nameInput = null as any;
    }
    if (this.gameIdInput) {
      document.body.removeChild(this.gameIdInput);
      this.gameIdInput = null as any;
    }
  }

  private createGameIdSubmitButton() {
    // Destroy existing button if it exists
    if (this.submitGameIdButton) {
      this.submitGameIdButton.destroy();
    }
    
    // Create a submit button for the game ID input
    this.submitGameIdButton = this.add.text(
      this.scale.width / 2 + 120,
      this.scale.height * 0.5,
      'Submit ID',
      {
        fontSize: '16px',
        color: '#FFFFFF',
        backgroundColor: '#0000AA',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    )
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.submitGameIdButton.setStyle({ color: '#FFFF00' }))
      .on('pointerout', () => this.submitGameIdButton.setStyle({ color: '#FFFFFF' }))
      .on('pointerdown', () => {
        if (this.gameIdInput) {
          this.gameId = this.gameIdInput.value;
          this.gameIdInput.blur();
          this.showConfirmation('Game ID submitted!');
        }
      });
  }

  shutdown() {
    this.cleanup();
    // Unbind event listeners
    if (this.startButton) this.startButton.removeAllListeners();
    if (this.joinButton) this.joinButton.removeAllListeners();
    if (this.backButton) this.backButton.removeAllListeners();
    if (this.submitNameButton) this.submitNameButton.removeAllListeners();
    if (this.submitGameIdButton) this.submitGameIdButton.removeAllListeners();
  }
} 