// using Microsoft.EntityFrameworkCore;
// using Microsoft.EntityFrameworkCore.Metadata.Builders;
//
// namespace EntityFrameworkCore.Entities;
//
// public class TestEntity
// {
//     public int Id { get; set; }
//     public required string Name { get; set; }
// }
//
// public class TestEntityConfiguration : IEntityTypeConfiguration<TestEntity>
// {
//     public void Configure(EntityTypeBuilder<TestEntity> builder)
//     {
//         builder.HasKey(e => e.Id);
//         builder.Property(e => e.Name)
//             .IsRequired()
//             .HasMaxLength(100);
//     }
// }