using ApiHost.Hubs.Services;
using Microsoft.AspNetCore.Authorization;

namespace ApiHost;

public static class RegisterServices
{
    public static void Register(WebApplicationBuilder builder)
    {
        // Register game services
        builder.Services.AddSingleton<ISnakeGameService, SnakeGameService>();

        //Authorization failure handler (For cors headers on auth failure)
        builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, CustomAuthorizationFailureHandler>();
    }
}