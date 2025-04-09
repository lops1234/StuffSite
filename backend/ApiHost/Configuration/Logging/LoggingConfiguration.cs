using OpenTelemetry.Logs;

namespace ApiHost;

public static class LoggingConfiguration
{
    public static void ConfigureLogging(WebApplicationBuilder builder)
    {
        // Get the logging options directly from the configuration
        var loggingOptions = builder.Configuration.GetSection("Logging").Get<LoggingOptions>();

        // Conditionally configure logging
        if (loggingOptions?.UseOpenTelemetry?.Value == true)
        {
            builder.Logging.ClearProviders();
            builder.Logging.AddOpenTelemetry(x => x.AddConsoleExporter());
        }
    }
}