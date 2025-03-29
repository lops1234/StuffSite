using BenchmarkDotNet.Attributes;
using InfrastructureExtensions;
using Microsoft.Extensions.Logging;

namespace TestDotNetAndStuff.Logger;

[MemoryDiagnoser]
public class LoggerBenchmarkTest
{
    private const string LogMessageWithParameters = "Logging message {0}, {1} and {2}";
    private const string LogMessage = "Logging message";

    private readonly ILoggerFactory _loggerFactory = LoggerFactory.Create(builder =>
    {
        builder.AddConsole().SetMinimumLevel(LogLevel.Warning);
    });

    private readonly ILogger<LoggerBenchmarkTest> _logger;


    public LoggerBenchmarkTest()
    {
        _logger = new Logger<LoggerBenchmarkTest>(_loggerFactory);
    }

    [Benchmark]
    public void Param_3()
    {
        _logger.LogInformation(LogMessageWithParameters, 1, 2, 3);
    }

    [Benchmark]
    public void Param_2()
    {
        _logger.LogInformation(LogMessageWithParameters,1, 2);
    }
    
    [Benchmark]
    public void Param_1()
    {
        _logger.LogInformation(LogMessageWithParameters,1);
    }

}