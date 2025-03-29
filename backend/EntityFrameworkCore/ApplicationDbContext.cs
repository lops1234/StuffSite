using System.Reflection;
using EntityFrameworkCore.Rules;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkCore;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<IdentityUser>(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ApplyAllConfigurations(modelBuilder, Assembly.GetExecutingAssembly());
    }


    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        Console.WriteLine($"{GetType().Name} OnConfiguring called");
        optionsBuilder.AddInterceptors(new PreventEfUpdateInterceptor());
        base.OnConfiguring(optionsBuilder);
    }

    private void ApplyAllConfigurations(ModelBuilder modelBuilder, Assembly assembly)
    {
        var applyGenericMethod = typeof(ModelBuilder).GetMethods()
            .First(m => m.Name == nameof(ModelBuilder.ApplyConfiguration) && m.GetParameters().Length == 1);

        var applicableTypes = assembly.GetTypes()
            .Where(t => t.GetInterfaces().Any(i =>
                i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>)))
            .ToList();

        foreach (var type in applicableTypes)
        {
            var entityType = type.GetInterfaces().First().GenericTypeArguments.First();
            var applyConcreteMethod = applyGenericMethod.MakeGenericMethod(entityType);
            var configurationInstance = Activator.CreateInstance(type);
            applyConcreteMethod.Invoke(modelBuilder, new[] { configurationInstance });
        }
    }
}