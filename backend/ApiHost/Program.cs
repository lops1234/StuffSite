using ApiHost;
using ApiHost.Hubs;
using ApiHost.Hubs.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
KestrelConfiguration.ConfigureKestrel(builder);
LoggingConfiguration.ConfigureLogging(builder);
DatabaseConfiguration.ConfigureDatabase(builder);
AuthorizationConfiguration.ConfigureAuthorization(builder);
CorsConfiguration.ConfigureCors(builder);

// Register SignalR services and configure for better performance
builder.Services.AddSignalR(options => 
{
    // Configure SignalR options for better performance
    options.MaximumReceiveMessageSize = 102400; // 100 KB
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
})
.AddJsonProtocol(options => 
{
    // Ignore null values in JSON to reduce payload size
    options.PayloadSerializerOptions.DefaultIgnoreCondition = 
        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// Register game services
builder.Services.AddSingleton<ISnakeGameService, SnakeGameService>();

builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, CustomAuthorizationFailureHandler>();

var app = builder.Build();
ConfigureExceptionPage();
ConfigureHttps();
ConfigureApiDocs();

// Use CORS BEFORE routing and endpoints
ConfigureCors();
app.UseRouting();
ConfigureAuthorization();

// Enable serving static files 
//This is for wwwroot signalr-test.html
app.UseDefaultFiles();
app.UseStaticFiles();

// Add a simple endpoint to test if the API is running
app.MapGet("/api/ping", () => "Pong! Server is running");

// Map SignalR hub
app.MapHub<SnakeGameHub>("/hubs/snake");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", (ILogger<Program> logger) =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast")
    .RequireAuthorization();

app.Run();

void ConfigureCors()
{
    app.UseCors(CorsConfiguration.CorsAllowSpecific);
     // app.UseCors(CorsConfiguration.CorsAllowAll);
}

void ConfigureExceptionPage()
{
    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }

    // app.UseExceptionHandler("/error");
    // app.UseStatusCodePagesWithReExecute("/error/{0}");
}

void ConfigureApiDocs()
{
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }
}

void ConfigureHttps()
{
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }

    app.UseHttpsRedirection();
}

void ConfigureAuthorization()
{
    app.MapCustomIdentityApi<IdentityUser>();

    // app.UseAuthentication();
    // app.UseAuthorization();
    // app.MapScalarApiReference().RequireAuthorization();
}

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}