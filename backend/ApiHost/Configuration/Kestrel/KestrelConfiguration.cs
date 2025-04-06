using System.Security.Cryptography.X509Certificates;

namespace ApiHost;

public static class KestrelConfiguration
{
    public static void ConfigureKestrel(WebApplicationBuilder builder)
    {
        CertificateConfiguration(builder);
        PortConfiguration(builder);
    }

    private static void CertificateConfiguration(WebApplicationBuilder builder)
    {
        var loggingOptions = builder.Configuration.GetSection("Certificate").Get<CertificateOptions>();

        var certPath = Environment.GetEnvironmentVariable("ASPNETCORE_Kestrel__Certificates__Default__Path") ??
                       loggingOptions?.Path;

        var certKey = Environment.GetEnvironmentVariable("ASPNETCORE_Kestrel__Certificates__Default__Password") ??
                      loggingOptions?.Password;

        // Console.WriteLine("certPath:" + certPath);
        // Console.WriteLine("certKey:" + certKey);


        builder.WebHost.ConfigureKestrel(options =>
        {
            options.ConfigureHttpsDefaults(httpsOptions =>
            {
                httpsOptions.ServerCertificate = X509CertificateLoader.LoadPkcs12FromFile(certPath!, certKey);
            });
        });
    }

    private static void PortConfiguration(WebApplicationBuilder builder)
    {
        if (HasAccessToLaunchSettings()) return;

        var httpPort = Environment.GetEnvironmentVariable("HTTP_PORT") ?? "5092";
        var httpsPort = Environment.GetEnvironmentVariable("HTTPS_PORT") ?? "7039";

        builder.WebHost.ConfigureKestrel(options =>
        {
            options.ListenAnyIP(int.Parse(httpPort),
                listenOptions =>
                {
                    listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1;
                });
            options.ListenAnyIP(int.Parse(httpsPort), listenOptions => { listenOptions.UseHttps(); });
        });
    }

    private static bool HasAccessToLaunchSettings()
    {
        var launchSettingsPath = Path.Combine(Directory.GetCurrentDirectory(), "Properties", "launchSettings.json");
        return File.Exists(launchSettingsPath);
    }
}