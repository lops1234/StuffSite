using ApiHost.Hubs.Models;
using ApiHost.Hubs.Services;
using Microsoft.AspNetCore.SignalR;

namespace ApiHost.Hubs;

public class SnakeGameHub : Hub
{
    private readonly ISnakeGameService _gameService;
    private readonly ILogger<SnakeGameHub> _logger;
    private readonly IHubContext<SnakeGameHub> _hubContext;
    private static readonly SemaphoreSlim _lock = new(1, 1);
    
    // Timer to update game state
    private static Timer? _gameUpdateTimer;
    
    // Timer to clean up inactive games
    private static Timer? _cleanupTimer;
    
    public SnakeGameHub(
        ISnakeGameService gameService, 
        ILogger<SnakeGameHub> logger,
        IHubContext<SnakeGameHub> hubContext)
    {
        _gameService = gameService;
        _logger = logger;
        _hubContext = hubContext;
        
        // Initialize timers if they haven't been initialized yet
        if (_gameUpdateTimer == null)
        {
            _gameUpdateTimer = new Timer(UpdateGames, null, TimeSpan.Zero, TimeSpan.FromMilliseconds(100));
        }
        
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
    
    // Timer callback to update game states
    private async void UpdateGames(object? state)
    {
        try
        {
            await _lock.WaitAsync();
            
            var gameIds = _gameService.GetActiveGameIds().ToList();
            
            foreach (var gameId in gameIds)
            {
                var updatedGame = _gameService.UpdateGameState(gameId);
                
                if (updatedGame != null)
                {
                    await _hubContext.Clients.Group(gameId).SendAsync("GameStateUpdated", updatedGame);
                    
                    // If the game just ended, notify players
                    if (!updatedGame.IsActive)
                    {
                        await _hubContext.Clients.Group(gameId).SendAsync("GameEnded", updatedGame);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating game states");
        }
        finally
        {
            _lock.Release();
        }
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
} 