using System.Collections.Concurrent;
using System.Drawing;
using ApiHost.Hubs.Models;

namespace ApiHost.Hubs.Services;

public interface ISnakeGameService
{
    SnakeGameState CreateGame(string connectionId, string playerName, SnakeGameSettings? settings = null);
    SnakeGameState? GetGame(string gameId);
    bool JoinGame(string gameId, string connectionId, string playerName);
    bool LeaveGame(string gameId, string connectionId);
    void UpdateDirection(string gameId, string connectionId, string direction);
    bool StartGame(string gameId);
    SnakeGameState? UpdateGameState(string gameId);
    IEnumerable<string> GetActiveGameIds();
    void RemoveInactiveGames();
}

public class SnakeGameService : ISnakeGameService
{
    private readonly ConcurrentDictionary<string, SnakeGameState> _games = new();
    private readonly Random _random = new();
    private readonly ILogger<SnakeGameService> _logger;
    
    // Available colors for players
    private readonly string[] _playerColors = new[]
    {
        "#00FF00", // Green
        "#FF0000", // Red
        "#0000FF", // Blue
        "#FFFF00"  // Yellow
    };

    public SnakeGameService(ILogger<SnakeGameService> logger)
    {
        _logger = logger;
    }

    public SnakeGameState CreateGame(string connectionId, string playerName, SnakeGameSettings? settings = null)
    {
        // Generate a 6-character game ID
        string gameId = GenerateGameId();
        
        // Apply default settings if none provided
        settings ??= new SnakeGameSettings();
        
        // Create game state
        var gameState = new SnakeGameState
        {
            GameId = gameId,
            HostConnectionId = connectionId,
            BoardWidth = settings.BoardWidth,
            BoardHeight = settings.BoardHeight,
            MaxPlayers = settings.MaxPlayers,
            GameDuration = settings.GameDuration
        };
        
        // Add host as the first player
        var hostPlayer = CreatePlayer(connectionId, playerName, _playerColors[0], settings.InitialSnakeLength);
        gameState.Players.TryAdd(connectionId, hostPlayer);
        
        // Generate initial flies
        GenerateFlies(gameState, settings.FlyCount);
        
        // Add game to collection
        _games.TryAdd(gameId, gameState);
        
        _logger.LogInformation("Game {GameId} created by {PlayerName}", gameId, playerName);
        
        return gameState;
    }

    public SnakeGameState? GetGame(string gameId)
    {
        return _games.TryGetValue(gameId, out var game) ? game : null;
    }

    public bool JoinGame(string gameId, string connectionId, string playerName)
    {
        if (!_games.TryGetValue(gameId, out var game))
        {
            _logger.LogWarning("Player {ConnectionId} tried to join non-existent game {GameId}", connectionId, gameId);
            return false;
        }
        
        if (game.IsActive)
        {
            _logger.LogWarning("Player {ConnectionId} tried to join active game {GameId}", connectionId, gameId);
            return false;
        }
        
        if (game.Players.Count >= game.MaxPlayers)
        {
            _logger.LogWarning("Player {ConnectionId} tried to join full game {GameId}", connectionId, gameId);
            return false;
        }
        
        // Find an available color
        string color = _playerColors[game.Players.Count % _playerColors.Length];
        
        // Create the player
        var player = CreatePlayer(connectionId, playerName, color, 3);
        
        // Add player to game
        if (game.Players.TryAdd(connectionId, player))
        {
            _logger.LogInformation("Player {PlayerName} joined game {GameId}", playerName, gameId);
            return true;
        }
        
        return false;
    }

    public bool LeaveGame(string gameId, string connectionId)
    {
        if (!_games.TryGetValue(gameId, out var game))
        {
            return false;
        }
        
        if (game.Players.TryRemove(connectionId, out _))
        {
            // If the host leaves, assign a new host or remove the game
            if (connectionId == game.HostConnectionId)
            {
                if (game.Players.Count > 0)
                {
                    // Assign the first remaining player as the new host
                    game.HostConnectionId = game.Players.Keys.First();
                    _logger.LogInformation("New host assigned in game {GameId}: {HostId}", gameId, game.HostConnectionId);
                }
                else
                {
                    // Remove the game if no players left
                    _games.TryRemove(gameId, out _);
                    _logger.LogInformation("Game {GameId} removed as all players left", gameId);
                }
            }
            
            _logger.LogInformation("Player {ConnectionId} left game {GameId}", connectionId, gameId);
            return true;
        }
        
        return false;
    }

    public void UpdateDirection(string gameId, string connectionId, string direction)
    {
        if (_games.TryGetValue(gameId, out var game) && 
            game.Players.TryGetValue(connectionId, out var player))
        {
            // Prevent 180-degree turns
            if ((direction == "up" && player.Direction == "down") ||
                (direction == "down" && player.Direction == "up") ||
                (direction == "left" && player.Direction == "right") ||
                (direction == "right" && player.Direction == "left"))
            {
                return;
            }
            
            player.Direction = direction;
        }
    }

    public bool StartGame(string gameId)
    {
        if (_games.TryGetValue(gameId, out var game) && !game.IsActive)
        {
            game.IsActive = true;
            game.LastUpdate = DateTime.UtcNow;
            _logger.LogInformation("Game {GameId} started with {PlayerCount} players", gameId, game.Players.Count);
            return true;
        }
        
        return false;
    }

    public SnakeGameState? UpdateGameState(string gameId)
    {
        if (!_games.TryGetValue(gameId, out var game) || !game.IsActive)
        {
            return null;
        }
        
        // If game has been running for longer than the duration, end it
        if ((DateTime.UtcNow - game.LastUpdate).TotalSeconds > game.GameDuration)
        {
            game.IsActive = false;
            _logger.LogInformation("Game {GameId} ended due to time limit", gameId);
            return game;
        }
        
        // Move each snake
        foreach (var player in game.Players.Values)
        {
            if (player.SnakeBody.Count == 0) continue;
            
            var head = player.SnakeBody[0];
            Point newHead = head;
            
            // Move the head based on direction
            switch (player.Direction)
            {
                case "up":
                    newHead = new Point(head.X, head.Y - 1);
                    break;
                case "down":
                    newHead = new Point(head.X, head.Y + 1);
                    break;
                case "left":
                    newHead = new Point(head.X - 1, head.Y);
                    break;
                case "right":
                    newHead = new Point(head.X + 1, head.Y);
                    break;
            }
            
            // Check for wall collisions (wrap around)
            if (newHead.X < 0) newHead.X = game.BoardWidth - 1;
            if (newHead.X >= game.BoardWidth) newHead.X = 0;
            if (newHead.Y < 0) newHead.Y = game.BoardHeight - 1;
            if (newHead.Y >= game.BoardHeight) newHead.Y = 0;
            
            // Check for collision with flies
            bool ateFly = false;
            for (int i = 0; i < game.Flies.Count; i++)
            {
                if (newHead.X == game.Flies[i].X && newHead.Y == game.Flies[i].Y)
                {
                    // Remove this fly
                    game.Flies.RemoveAt(i);
                    
                    // Add a new fly
                    AddFly(game);
                    
                    // Increment player score
                    player.Score += 10;
                    
                    // Snake grows
                    ateFly = true;
                    break;
                }
            }
            
            // Check for collisions with other snakes or self
            bool collision = false;
            foreach (var otherPlayer in game.Players.Values)
            {
                // Skip the first segment of the current player's snake if we're checking self-collision
                int startIdx = player == otherPlayer ? 1 : 0;
                
                for (int i = startIdx; i < otherPlayer.SnakeBody.Count; i++)
                {
                    if (newHead.X == otherPlayer.SnakeBody[i].X && newHead.Y == otherPlayer.SnakeBody[i].Y)
                    {
                        collision = true;
                        break;
                    }
                }
                
                if (collision) break;
            }
            
            if (collision)
            {
                // Reset the snake
                ResetPlayerSnake(game, player);
                
                // Deduct points for collision
                player.Score = Math.Max(0, player.Score - 5);
                continue;
            }
            
            // Add the new head
            player.SnakeBody.Insert(0, newHead);
            
            // If we didn't eat a fly, remove the tail
            if (!ateFly)
            {
                player.SnakeBody.RemoveAt(player.SnakeBody.Count - 1);
            }
        }
        
        game.LastUpdate = DateTime.UtcNow;
        return game;
    }

    public IEnumerable<string> GetActiveGameIds()
    {
        return _games.Keys;
    }

    public void RemoveInactiveGames()
    {
        var keysToRemove = _games
            .Where(g => !g.Value.IsActive && (DateTime.UtcNow - g.Value.LastUpdate).TotalMinutes > 10)
            .Select(g => g.Key)
            .ToList();
        
        foreach (var key in keysToRemove)
        {
            _games.TryRemove(key, out _);
            _logger.LogInformation("Removed inactive game {GameId}", key);
        }
    }

    // Helper methods
    private SnakePlayer CreatePlayer(string connectionId, string playerName, string color, int initialLength)
    {
        var player = new SnakePlayer
        {
            ConnectionId = connectionId,
            PlayerId = Guid.NewGuid().ToString(),
            Name = playerName,
            Color = color
        };
        
        // Calculate unique starting position based on player count
        int playerCount = _games.Values
            .SelectMany(g => g.Players.Values)
            .Count(p => p.ConnectionId == connectionId);
        
        // Position snakes in different quadrants of the board
        int boardQuadrant = playerCount % 4;
        int startX, startY;
        string initialDirection;
        
        switch (boardQuadrant)
        {
            case 0: // Top-left
                startX = 5;
                startY = 5;
                initialDirection = "right";
                break;
            case 1: // Top-right
                startX = 20;
                startY = 5;
                initialDirection = "left";
                break;
            case 2: // Bottom-left
                startX = 5;
                startY = 20;
                initialDirection = "right";
                break;
            case 3: // Bottom-right
                startX = 20;
                startY = 20;
                initialDirection = "left";
                break;
            default:
                startX = 10;
                startY = 10;
                initialDirection = "right";
                break;
        }
        
        // Add random offset to prevent exact overlap if multiple games
        startX += _random.Next(-2, 3);
        startY += _random.Next(-2, 3);
        
        // Set initial direction
        player.Direction = initialDirection;
        
        // Create snake body based on direction
        for (int i = 0; i < initialLength; i++)
        {
            Point segment;
            switch (initialDirection)
            {
                case "right":
                    segment = new Point(startX - i, startY);
                    break;
                case "left":
                    segment = new Point(startX + i, startY);
                    break;
                case "up":
                    segment = new Point(startX, startY + i);
                    break;
                case "down":
                    segment = new Point(startX, startY - i);
                    break;
                default:
                    segment = new Point(startX - i, startY);
                    break;
            }
            player.SnakeBody.Add(segment);
        }
        
        _logger.LogInformation("Created player snake at position ({X},{Y}) with direction {Direction}", 
            startX, startY, initialDirection);
        
        return player;
    }

    private void GenerateFlies(SnakeGameState game, int count)
    {
        for (int i = 0; i < count; i++)
        {
            AddFly(game);
        }
    }

    private void AddFly(SnakeGameState game)
    {
        int attempts = 0;
        while (attempts < 100)
        {
            int x = _random.Next(0, game.BoardWidth);
            int y = _random.Next(0, game.BoardHeight);
            Point fly = new Point(x, y);
            
            // Check if position is already occupied by a snake or another fly
            bool isOccupied = game.Flies.Any(f => f.X == x && f.Y == y) ||
                              game.Players.Values.Any(p => p.SnakeBody.Any(s => s.X == x && s.Y == y));
            
            if (!isOccupied)
            {
                game.Flies.Add(fly);
                return;
            }
            
            attempts++;
        }
        
        // If we failed to find an empty spot after 100 attempts, just place it randomly
        game.Flies.Add(new Point(_random.Next(0, game.BoardWidth), _random.Next(0, game.BoardHeight)));
    }

    private void ResetPlayerSnake(SnakeGameState game, SnakePlayer player)
    {
        // Clear existing snake body
        player.SnakeBody.Clear();
        
        // Get player index in the current game
        int playerIndex = game.Players.Values.ToList().FindIndex(p => p.ConnectionId == player.ConnectionId);
        if (playerIndex < 0) playerIndex = 0;
        
        // Position reset snake in different quadrants based on player index
        int boardQuadrant = playerIndex % 4;
        int startX, startY;
        string initialDirection;
        
        // Board dimensions
        int width = game.BoardWidth;
        int height = game.BoardHeight;
        
        switch (boardQuadrant)
        {
            case 0: // Top-left quadrant
                startX = width / 4;
                startY = height / 4;
                initialDirection = "right";
                break;
            case 1: // Top-right quadrant
                startX = (width * 3) / 4;
                startY = height / 4;
                initialDirection = "left";
                break;
            case 2: // Bottom-left quadrant
                startX = width / 4;
                startY = (height * 3) / 4;
                initialDirection = "right";
                break;
            case 3: // Bottom-right quadrant
                startX = (width * 3) / 4;
                startY = (height * 3) / 4;
                initialDirection = "left";
                break;
            default:
                startX = width / 2;
                startY = height / 2;
                initialDirection = "right";
                break;
        }
        
        // Add small random offset
        startX += _random.Next(-3, 4);
        startY += _random.Next(-3, 4);
        
        // Ensure snake is within bounds
        startX = Math.Max(3, Math.Min(width - 3, startX));
        startY = Math.Max(3, Math.Min(height - 3, startY));
        
        // Reset direction
        player.Direction = initialDirection;
        
        // Create snake body based on direction
        for (int i = 0; i < 3; i++)
        {
            Point segment;
            switch (initialDirection)
            {
                case "right":
                    segment = new Point(startX - i, startY);
                    break;
                case "left":
                    segment = new Point(startX + i, startY);
                    break;
                case "up":
                    segment = new Point(startX, startY + i);
                    break;
                case "down":
                    segment = new Point(startX, startY - i);
                    break;
                default:
                    segment = new Point(startX - i, startY);
                    break;
            }
            player.SnakeBody.Add(segment);
        }
        
        _logger.LogInformation("Reset player snake at position ({X},{Y}) with direction {Direction}", 
            startX, startY, initialDirection);
    }

    private string GenerateGameId()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Repeat(chars, 6)
            .Select(s => s[_random.Next(s.Length)])
            .ToArray());
    }
} 