using Microsoft.Extensions.Logging;

namespace InfrastructureExtensions;

public static class LoggerExtensions
{
    public static void LogInformation<T>(this ILogger<T> logger, string message)
    {
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(message);
        }
    }

    public static void LogInformation<T, T0>(this ILogger<T> logger, string message, T0 arg0)
    {
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.Log(LogLevel.Information, null, message, arg0);
        }
    }

    public static void LogInformation<T, T0, T1>(this ILogger<T> logger, string message, T0 arg0, T1 arg1)
    {
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.Log(LogLevel.Information, null, message, arg0, arg1);
        }
    }

    public static void LogInformation<T, T0, T1, T2>(this ILogger<T> logger, string message, T0 arg0, T1 arg1, T2 arg2)
    {
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.Log(LogLevel.Information, null, message, arg0, arg1, arg2);
        }
    }
}