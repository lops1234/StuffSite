namespace ApiHost;

public class CorsOptions
{
    public string? AllowedOrigins { get; init; }
    public string? AllowedMethods { get; init; }
    public string? AllowedHeaders { get; init; }
}