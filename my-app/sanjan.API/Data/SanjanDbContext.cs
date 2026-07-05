using Microsoft.EntityFrameworkCore;
using Sanjan.API.Models;

namespace Sanjan.API.Data
{
    public class SanjanDbContext : DbContext
    {
        public SanjanDbContext(DbContextOptions<SanjanDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AiLog> AiLogs { get; set; }
        public DbSet<UserVaultStats> UserVaultStats { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);
                entity.Property(u => u.UserId).HasDefaultValueSql("uuid_generate_v4()");
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(u => u.DisplayName).HasMaxLength(100);
                entity.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
                entity.Property(u => u.UpdatedAt).HasDefaultValueSql("now()");
                entity.Property(u => u.IsActive).HasDefaultValue(true);
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(r => r.TokenId);
                entity.Property(r => r.TokenId).HasDefaultValueSql("uuid_generate_v4()");
                entity.Property(r => r.TokenHash).IsRequired().HasMaxLength(255);
                entity.Property(r => r.IssuedAt).HasDefaultValueSql("now()");

                entity.HasOne(r => r.User)
                      .WithMany(u => u.RefreshTokens)
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.ReplacedByToken)
                      .WithMany()
                      .HasForeignKey(r => r.ReplacedByTokenId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<AiLog>(entity =>
            {
                entity.HasKey(a => a.LogId);
                entity.Property(a => a.LogId).HasDefaultValueSql("uuid_generate_v4()");
                entity.Property(a => a.FeatureType).HasConversion<string>();
                entity.Property(a => a.Status).HasConversion<string>();
                entity.Property(a => a.RetryCount).HasDefaultValue((short)0);
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("now()");

                entity.HasOne(a => a.User)
                      .WithMany(u => u.AiLogs)
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<UserVaultStats>(entity =>
            {
                entity.HasKey(v => v.UserId);
                entity.Property(v => v.TotalNotes).HasDefaultValue(0);
                entity.Property(v => v.TotalBridgeNotes).HasDefaultValue(0);
                entity.Property(v => v.TotalStudyNotes).HasDefaultValue(0);
                entity.Property(v => v.TotalLinks).HasDefaultValue(0);
                entity.Property(v => v.UpdatedAt).HasDefaultValueSql("now()");

                entity.HasOne(v => v.User)
                      .WithOne(u => u.VaultStats)
                      .HasForeignKey<UserVaultStats>(v => v.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}