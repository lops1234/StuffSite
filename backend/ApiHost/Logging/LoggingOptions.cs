namespace ApiHost;

public class LoggingOptions
{
    public LogLevelOptions? LogLevel { get; init; }
    public UseOpenTelemetryOptions? UseOpenTelemetry { get; init; }
}

public class LogLevelOptions
{
    public string? Default { get; init; }
    public string? MicrosoftAspNetCore { get; init; }
}

public class UseOpenTelemetryOptions
{
    public bool? Value { get; init; }
}