using Microsoft.IdentityModel.Tokens;

namespace ApiHost;

public static class CorsConfiguration
{
    public const string CorsAllowAll = "AllowAll";
    public const string CorsAllowSpecific = "AllowSpecificOrigin";

    public static void ConfigureCors(WebApplicationBuilder builder)
    {
        var corsOptions = builder.Configuration.GetSection("Cors").Get<CorsOptions>();

        var allowedOrigins = Environment.GetEnvironmentVariable("ASPNETCORE_CORS_AllowedOrigins") ??
                             corsOptions?.AllowedOrigins;

        var allowedMethods = Environment.GetEnvironmentVariable("ASPNETCORE_CORS_AllowedMethods") ??
                             corsOptions?.AllowedMethods;

        var allowedHeaders = Environment.GetEnvironmentVariable("ASPNETCORE_CORS_AllowedHeaders") ??
                             corsOptions?.AllowedHeaders;

        Console.WriteLine("allowedOrigins: " + allowedOrigins);
        Console.WriteLine("allowedMethods: " + allowedMethods);
        Console.WriteLine("allowedHeaders: " + allowedHeaders);

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(CorsAllowSpecific,
                policy =>
                {
                    var origins = allowedOrigins.IsNullOrEmpty()
                        ? ["https://localhost:5173"]
                        : allowedOrigins!.Split(", ");

                    var methods = allowedMethods.IsNullOrEmpty()
                        ? ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
                        : allowedMethods!.Split(", ");

                    var headers = allowedHeaders.IsNullOrEmpty()
                        ? ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-SignalR-User-Agent"]
                        : allowedHeaders!.Split(", ");

                    Console.WriteLine("Origins: " + string.Join(", ", origins));
                    Console.WriteLine("Methods: " + string.Join(", ", methods));
                    Console.WriteLine("Headers: " + string.Join(", ", headers));

                    policy.WithOrigins(origins)
                        .WithMethods(methods)
                        .WithHeaders(headers)
                        .AllowCredentials()
                        .SetPreflightMaxAge(TimeSpan.FromMinutes(10))
                        .SetIsOriginAllowedToAllowWildcardSubdomains();
                });

            options.AddPolicy(name: CorsAllowAll,
                policy =>
                {
                    policy
                        .AllowAnyOrigin()
                        .AllowAnyMethod()
                        .SetIsOriginAllowed(_ => true) 
                        .AllowAnyHeader();
                });
        });
    }
}