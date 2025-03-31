import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import LobbyScene from './scenes/LobbyScene';
import GameScene from './scenes/GameScene';

const SnakeGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInitializedRef = useRef(false);

  useEffect(() => {
    // Clear console to make debugging easier
    console.clear();
    console.log('Snake Game: Initializing...');

    // Make sure we don't create multiple game instances
    if (gameRef.current || gameInitializedRef.current) {
      console.log('Game instance already exists, not creating a new one');
      return;
    }

    gameInitializedRef.current = true;

    // Add input styling once
    const style = document.createElement('style');
    style.id = 'snake-game-input-style';
    style.innerHTML = `
      input {
        z-index: 1000 !important;
        font-family: Arial, sans-serif;
      }
    `;
    
    // Only add if it doesn't exist
    if (!document.getElementById('snake-game-input-style')) {
      document.head.appendChild(style);
    }

    try {
      // Create the Phaser game configuration
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'snake-game-canvas',
        width: 800,
        height: 600,
        backgroundColor: '#000000',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        dom: {
          createContainer: true
        },
        scene: [
          BootScene,
          MenuScene,
          LobbyScene,
          GameScene
        ]
      };

      // Create the game instance with a slight delay to ensure DOM is ready
      setTimeout(() => {
        try {
          if (document.getElementById('snake-game-canvas')) {
            console.log('Creating Phaser game instance');
            gameRef.current = new Phaser.Game(config);
            
            // Add game instance to window for debugging
            (window as any).snakeGame = gameRef.current;
            
            // Log when game is ready
            gameRef.current.events.once('ready', () => {
              console.log('Phaser game ready!');
            });
          } else {
            console.error('Game container element not found!');
          }
        } catch (err) {
          console.error('Error creating Phaser game:', err);
        }
      }, 300);
    } catch (err) {
      console.error('Error in Snake game setup:', err);
    }

    // Cleanup when component unmounts
    return () => {
      try {
        if (gameRef.current) {
          console.log('Destroying Phaser game instance');
          gameRef.current.destroy(true);
          gameRef.current = null;
          gameInitializedRef.current = false;
        }
        
        // Remove style element if it exists
        const styleElem = document.getElementById('snake-game-input-style');
        if (styleElem) {
          document.head.removeChild(styleElem);
        }
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
    };
  }, []);

  return (
    <div className="snake-game-container">
      <div id="snake-game-canvas" ref={gameContainerRef} className="snake-game-canvas"></div>
      <style>
        {`
        .snake-game-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          min-height: 600px;
          position: relative;
          overflow: visible;
        }
        .snake-game-canvas {
          width: 800px;
          height: 600px;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
          border-radius: 4px;
          overflow: visible;
          position: relative;
          z-index: 1;
        }
        canvas {
          display: block;
        }
        `}
      </style>
    </div>
  );
};

export default SnakeGame; 