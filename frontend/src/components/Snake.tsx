import React from 'react';
import SnakeGame from '../game/snake/SnakeGame';

const Snake: React.FC = () => {
  return (
    <div className="container">
      <header className="jumbotron">
        <h3>Multiplayer Snake Game</h3>
        <p>Compete with other players to catch flies and get the highest score!</p>
      </header>
      <div className="game-container">
        <SnakeGame />
      </div>
      <div className="instructions">
        <h4>How to Play:</h4>
        <ul>
          <li>Use the arrow keys to control your snake</li>
          <li>Eat flies to grow longer and earn points</li>
          <li>Avoid colliding with other players or yourself</li>
          <li>The player with the highest score at the end wins!</li>
        </ul>
      </div>
      <style>
        {`
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
          }
          .jumbotron {
            background-color: #343a40;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .game-container {
            margin-bottom: 20px;
          }
          .instructions {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
          }
          .instructions h4 {
            margin-top: 0;
            color: #343a40;
          }
          .instructions ul {
            padding-left: 20px;
          }
        `}
      </style>
    </div>
  );
};

export default Snake; 