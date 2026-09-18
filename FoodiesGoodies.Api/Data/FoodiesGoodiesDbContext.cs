using FoodiesGoodies.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FoodiesGoodies.Api.Data;

public class FoodiesGoodiesDbContext : IdentityDbContext<ApplicationUser>
{
    public FoodiesGoodiesDbContext(DbContextOptions<FoodiesGoodiesDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(b =>
        {
            b.Property(u => u.DisplayName).HasMaxLength(100);
            b.Property(u => u.DietaryFocus).HasMaxLength(150);
            b.Property(u => u.Rank).HasMaxLength(50);
            b.Property(u => u.ProfilePic).HasMaxLength(500);
            b.Property(u => u.CoverPic).HasMaxLength(500);
            b.Property(u => u.Bio).HasMaxLength(2000);
            b.HasIndex(u => u.Email).IsUnique();
        });
    }
}
