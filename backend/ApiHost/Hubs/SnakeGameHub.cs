using ApiHost.Hubs.Models;
using ApiHost.Hubs.Services;
using Microsoft.AspNetCore.SignalR;

namespace ApiHost.Hubs;

public class SnakeGameHub : Hub
{
    private readonly ISnakeGameService _gameService;
    private readonly ILogger<SnakeGameHub> _logger;
    private readonly IHubContext<SnakeGameHub> _hubContext;
// Removed unused static field _lock
    
    // Timer to clean up inactive games
    private static Timer? _cleanupTimer;
    
    private static Dictionary<string, Timer> _gameTimers = new Dictionary<string, Timer>();
    private static readonly object _timerLock = new object();
    
    public SnakeGameHub(
        ISnakeGameService gameService, 
        ILogger<SnakeGameHub> logger,
        IHubContext<SnakeGameHub> hubContext)
    {
        _gameService = gameService;
        _logger = logger;
        _hubContext = hubContext;
        
        // Initialize cleanup timer if not already initialized
        if (_cleanupTimer == null)
        {
            _cleanupTimer = new Timer(CleanupInactiveGames, null, TimeSpan.Zero, TimeSpan.FromMinutes(5));
        }
    }
    
    // Create a new game
    public async Task<SnakeGameState> CreateGame(CreateGameRequest request)
    {
        var game = _gameService.CreateGame(Context.ConnectionId, request.PlayerName, request.Settings);
        
        // Add the connection to the game group
        await Groups.AddToGroupAsync(Context.ConnectionId, game.GameId);
        
        return game;
    }
    
    // Join an existing game
    public async Task<bool> JoinGame(JoinGameRequest request)
    {
        var result = _gameService.JoinGame(request.GameId, Context.ConnectionId, request.PlayerName);
        
        if (result)
        {
            // Add the connection to the game group
            await Groups.AddToGroupAsync(Context.ConnectionId, request.GameId);
            
            // Get updated game state
            var game = _gameService.GetGame(request.GameId);
            
            // Notify all players in the game about the new player
            if (game != null)
            {
                await _hubContext.Clients.Group(request.GameId).SendAsync("PlayerJoined", game);
            }
        }
        
        return result;
    }
    
    // Start the game (host only)
    public async Task<bool> StartGame(string gameId)
    {
        var game = _gameService.GetGame(gameId);
        
        if (game == null)
        {
            return false;
        }
        
        // Only the host can start the game
        if (game.HostConnectionId != Context.ConnectionId)
        {
            return false;
        }
        
        var result = _gameService.StartGame(gameId);
        
        if (result)
        {
            await _hubContext.Clients.Group(gameId).SendAsync("GameStarted", game);
            
            // Start with initial game state
            var gameState = _gameService.UpdateGameState(gameId);
            
            if (gameState != null)
            {
                // Notify all clients of the initial state
                await _hubContext.Clients.Group(gameId).SendAsync("GameStateUpdated", gameState);
                
                // Create a timer to update the game state every 200ms (5 updates per second)
                StartGameTimer(gameId);
            }
        }
        
        return result;
    }
    
    // Update direction
    public void UpdateDirection(DirectionUpdateRequest request, string gameId)
    {
        _gameService.UpdateDirection(gameId, Context.ConnectionId, request.Direction);
    }
    
    // Get a list of available games to join
    public IEnumerable<SnakeGameState> GetAvailableGames()
    {
        var gameIds = _gameService.GetActiveGameIds();
        var availableGames = new List<SnakeGameState>();
        
        foreach (var gameId in gameIds)
        {
            var game = _gameService.GetGame(gameId);
            
            if (game != null && !game.IsActive && game.Players.Count < game.MaxPlayers)
            {
                availableGames.Add(game);
            }
        }
        
        return availableGames;
    }
    
    // Get specific game
    public SnakeGameState? GetGame(string gameId)
    {
        return _gameService.GetGame(gameId);
    }

    // Handle disconnection
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Find all games this player is in
        var gameIds = _gameService.GetActiveGameIds()
            .Where(gameId => 
            {
                var game = _gameService.GetGame(gameId);
                return game?.Players.ContainsKey(Context.ConnectionId) == true;
            })
            .ToList();
        
        // Leave each game
        foreach (var gameId in gameIds)
        {
            _gameService.LeaveGame(gameId, Context.ConnectionId);
            
            // Notify other players
            var game = _gameService.GetGame(gameId);
            if (game != null)
            {
                await _hubContext.Clients.Group(gameId).SendAsync("PlayerLeft", game, Context.ConnectionId);
            }
        }
        
        await base.OnDisconnectedAsync(exception);
    }
    
    // Timer callback to clean up inactive games
    private void CleanupInactiveGames(object? state)
    {
        try
        {
            _gameService.RemoveInactiveGames();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up inactive games");
        }
    }
    
    private void StartGameTimer(string gameId)
    {
        lock (_timerLock)
        {
            // Clean up any existing timer
            if (_gameTimers.ContainsKey(gameId))
            {
                _gameTimers[gameId].Dispose();
            }
            
            // Create a new timer that fires every 50ms (20 updates per second) for very smooth movement
            var timer = new Timer(UpdateGameCallback, gameId, 0, 50);
            _gameTimers[gameId] = timer;
            
            _logger.LogInformation("Started game timer for game {GameId}", gameId);
        }
    }
    
    private async void UpdateGameCallback(object? state)
    {
        if (state == null) return;
        
        string gameId = (string)state;
        
        try
        {
            var gameState = _gameService.UpdateGameState(gameId);
            
            if (gameState != null)
            {
                if (gameState.IsActive)
                {
                    // Game is still active, broadcast updates
                    await _hubContext.Clients.Group(gameId).SendAsync("GameStateUpdated", gameState);
                }
                else
                {
                    // Game has ended, stop the timer and notify clients
                    StopGameTimer(gameId);
                    await _hubContext.Clients.Group(gameId).SendAsync("GameEnded", gameState);
                    
                    _logger.LogInformation("Game {GameId} has ended", gameId);
                }
            }
            else
            {
                // Game not found or already ended, stop the timer
                StopGameTimer(gameId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating game {GameId}", gameId);
        }
    }
    
    private void StopGameTimer(string gameId)
    {
        lock (_timerLock)
        {
            if (_gameTimers.ContainsKey(gameId))
            {
                _gameTimers[gameId].Dispose();
                _gameTimers.Remove(gameId);
                
                _logger.LogInformation("Stopped game timer for game {GameId}", gameId);
            }
        }
    }
} 