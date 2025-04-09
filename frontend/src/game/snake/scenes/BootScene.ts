import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('BootScene: preloading assets started');

    // Create a loading text
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Loading game...',
      {
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2,
      320,
      50
    );

    // Register load progress events
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 + 10,
        300 * value,
        30
      );
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      console.log('BootScene: Assets loading completed');
    });

    // Add error handler for failed loads
    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.src);
    });

    // Create simple colored rectangles instead of using base64 images
    this.createSimpleAssets();

    // Create animations
    this.anims.create({
      key: 'fly',
      frames: [
        { key: 'fly1' },
        { key: 'fly2' }
      ],
      frameRate: 10,
      repeat: -1
    });
  }
  
  private createSimpleAssets() {
    // Create a canvas for food (red square)
    this.createCanvasTexture('food', 16, 16, (ctx) => {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 16, 16);
    });
    
    // Create a canvas for snake head (green square)
    this.createCanvasTexture('snake-head', 16, 16, (ctx) => {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, 16, 16);
    });
    
    // Create a canvas for snake body (lighter green square)
    this.createCanvasTexture('snake-body', 16, 16, (ctx) => {
      ctx.fillStyle = '#00dd00';
      ctx.fillRect(0, 0, 16, 16);
    });
    
    // Create a canvas for fly frame 1
    this.createCanvasTexture('fly1', 32, 16, (ctx) => {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(0, 0, 32, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(5, 5, 5, 5);
    });
    
    // Create a canvas for fly frame 2
    this.createCanvasTexture('fly2', 32, 16, (ctx) => {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(0, 0, 32, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(20, 5, 5, 5);
    });
    
    // Create a canvas for background (black)
    this.createCanvasTexture('background', 64, 64, (ctx) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 64, 64);
    });
    
    // Create a canvas for game-over text
    this.createCanvasTexture('game-over', 200, 50, (ctx) => {
      ctx.fillStyle = '#ff0000';
      ctx.font = '40px Arial';
      ctx.fillText('GAME OVER', 0, 40);
    });
  }
  
  private createCanvasTexture(key: string, width: number, height: number, 
    render: (ctx: CanvasRenderingContext2D) => void) {
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      render(ctx);
      this.textures.addCanvas(key, canvas);
    }
  }
  
  create() {
    console.log('BootScene: create method called, transitioning to MenuScene');
    // Start main menu scene
    this.scene.start('MenuScene');
  }
} 