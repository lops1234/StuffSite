using EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Migrator;

Console.WriteLine("Starting Migrator");
Environment.SetEnvironmentVariable("RUNNING_MIGRATIONS", "true");
var host = CreateHostBuilder(args).Build();
ApplyMigrations(host, args);
return;

static void ApplyMigrations(IHost host, string[] args)
{
    Console.WriteLine("Find Migrations");
    using var scope = host.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    
    if (args.Length != 0)
    {
        Console.WriteLine("Starting migration specific...");
        Console.WriteLine($"Migrating to version: {args[0]}");
        context.Database.Migrate(args[0]);
        Console.WriteLine("Migrations successfully.");
        return;
    }

    var pendingMigrations = context.Database.GetPendingMigrations().ToList();
    if (pendingMigrations.Any())
    {
        Console.WriteLine("Starting migrations...");
        Console.WriteLine("Pending migrations: {0}", pendingMigrations.Count);

        foreach (var migration in pendingMigrations)
        {
            Console.WriteLine($"Applying migration: {migration}");
            context.Database.Migrate(migration);
        }

        Console.WriteLine("All migrations applied successfully.");
    }
    else
    {
        Console.WriteLine("No pending migrations.");
    }
}

static IHostBuilder CreateHostBuilder(string[] args) =>
    Host.CreateDefaultBuilder(args)
        .ConfigureServices((_, services) =>
        {
            var dbContextFactory = new DbContextFactory();
            var context = dbContextFactory.CreateDbContext(args);

            services.AddSingleton(context);
        });