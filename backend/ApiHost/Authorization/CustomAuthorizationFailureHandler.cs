using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace ApiHost;

public class CustomAuthorizationFailureHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new AuthorizationMiddlewareResultHandler();
    private static readonly string[] Value = new[] { "Content-Type", "Authorization" };
    private static readonly string[] ValueArray = new[] { "GET", "POST", "PUT", "DELETE", "OPTIONS" };

    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Challenged || authorizeResult.Forbidden)
        {
            context.Response.OnStarting(() =>
            {
                var origin = context.Request.Headers.Origin.ToString();
                context.Response.Headers.Append("Access-Control-Allow-Origin", origin);

                context.Response.Headers.Append("Access-Control-Allow-Headers", Value);
                context.Response.Headers.Append("Access-Control-Allow-Methods", ValueArray);
                return Task.CompletedTask;
            });
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}