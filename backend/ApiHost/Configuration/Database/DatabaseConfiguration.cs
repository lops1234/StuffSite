using EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ApiHost;

public static class DatabaseConfiguration
{
    public static void ConfigureDatabase(WebApplicationBuilder builder)
    {
        var connectionString = Environment.GetEnvironmentVariable("APP_CONNECTION_STRING") ??
                               builder.Configuration.GetConnectionString("DefaultConnection");

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));
    }
}