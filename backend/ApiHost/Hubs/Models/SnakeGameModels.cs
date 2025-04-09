using System.Collections.Concurrent;
using System.Drawing;

namespace ApiHost.Hubs.Models;

// Player model
public class SnakePlayer
{
    public string ConnectionId { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; } = 0;
    public List<Point> SnakeBody { get; set; } = new List<Point>();
    public string Direction { get; set; } = "right";
    public string Color { get; set; } = "#00FF00";
}

// Game state model
public class SnakeGameState
{
    public string GameId { get; set; } = string.Empty;
    public string HostConnectionId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = false;
    public ConcurrentDictionary<string, SnakePlayer> Players { get; set; } = new();
    public List<Point> Flies { get; set; } = new();
    public int BoardWidth { get; set; } = 40;
    public int BoardHeight { get; set; } = 30;
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public int MaxPlayers { get; set; } = 4;
    public int GameDuration { get; set; } = 30; // 30 seconds
}

// Game settings
public class SnakeGameSettings
{
    public int BoardWidth { get; set; } = 40;
    public int BoardHeight { get; set; } = 30;
    public int InitialSnakeLength { get; set; } = 3;
    public int MaxPlayers { get; set; } = 4;
    public int GameDuration { get; set; } = 30; // 30 seconds
    public int FlyCount { get; set; } = 5;
}

// Game creation request
public class CreateGameRequest
{
    public string PlayerName { get; set; } = string.Empty;
    public SnakeGameSettings? Settings { get; set; }
}

// Game join request
public class JoinGameRequest
{
    public string GameId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
}

// Direction update
public class DirectionUpdateRequest
{
    public string Direction { get; set; } = string.Empty;
} 