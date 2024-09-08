using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class PointContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public PointContext(DbContextOptions<PointContext> options, IConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        public DbSet<Point> Points { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseNpgsql(_configuration.GetConnectionString("DefaultConnection"));
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Point>()
                .HasKey(p => p.UniqueId);

            // Points DbSet'ini "staj" tablosu ile eşleştir
            modelBuilder.Entity<Point>().ToTable("staj");
        }
    }
}
