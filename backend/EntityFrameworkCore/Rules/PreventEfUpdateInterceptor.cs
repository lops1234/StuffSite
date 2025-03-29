using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace EntityFrameworkCore.Rules;

public class PreventEfUpdateInterceptor : DbCommandInterceptor
{
    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result)
    {
        if (command.CommandText.Contains("__EFMigrationsHistory") &&
            Environment.GetEnvironmentVariable("RUNNING_MIGRATIONS") != "true")
        {
            throw new InvalidOperationException(
                "Direct database updates using 'dotnet ef database update' are not allowed.");
        }

        return base.NonQueryExecuting(command, eventData, result);
    }
}