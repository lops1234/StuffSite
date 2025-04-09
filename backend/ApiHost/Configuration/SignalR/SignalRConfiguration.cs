namespace ApiHost;

public static class SignalRConfiguration
{
    public static void ConfigureSignalR(WebApplicationBuilder builder)
    {
        
        //move options to configuration files/ env for docker
        
        builder.Services.AddSignalR(options => 
        {
            // Configure SignalR options for better performance
            options.MaximumReceiveMessageSize = 102400; // 100 KB
            options.EnableDetailedErrors = builder.Environment.IsDevelopment();
            options.KeepAliveInterval = TimeSpan.FromSeconds(15);
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        }).AddJsonProtocol(options => 
        {
            //this needs to be replaced. For speed reasons. Use message protocol instead of json.
            
            
            // Ignore null values in JSON to reduce payload size
            options.PayloadSerializerOptions.DefaultIgnoreCondition = 
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });
        
        
    }
    
}