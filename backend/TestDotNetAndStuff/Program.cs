// See https://aka.ms/new-console-template for more information

using BenchmarkDotNet.Running;
using TestDotNetAndStuff.Logger;

Console.WriteLine("Hello, World!");

BenchmarkRunner.Run<LoggerBenchmarkTest>();