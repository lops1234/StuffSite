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
                    policy.WithOrigins(allowedOrigins.IsNullOrEmpty()
                            ? ["https://localhost:5173"]
                            : allowedOrigins!.Split(", "))
                        .WithMethods(allowedMethods.IsNullOrEmpty()
                            ? ["GET", "POST", "PUT", "DELETE"]
                            : allowedMethods!.Split(", "))
                        .WithHeaders(allowedHeaders.IsNullOrEmpty()
                            ? ["Content-Type", "Authorization"]
                            : allowedHeaders!.Split(", "))
                        .AllowCredentials();
                });

            options.AddPolicy(name: CorsAllowAll,
                policy =>
                {
                    policy
                        .AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader();
                });
        });
    }
}