// Data/ApplicationDbContext.cs
using Api.Enums;
using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Update DbSet to use TransportoPriemone
        public DbSet<TransportoPriemone> TransportoPriemones { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure the enum to be stored as string in database
            modelBuilder.Entity<TransportoPriemone>()
                .Property(v => v.KuroTipas)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Optional: Seed some initial data
            modelBuilder.Entity<TransportoPriemone>().HasData(
                new TransportoPriemone { ValstybiniaiNum = "ABC123", Rida = 50000, VietuSk = 5, KuroTipas = KuroTipas.Benzinas },
                new TransportoPriemone { ValstybiniaiNum = "DEF456", Rida = 80000, VietuSk = 7, KuroTipas = KuroTipas.Dyzelinas },
                new TransportoPriemone { ValstybiniaiNum = "GHI789", Rida = 30000, VietuSk = 4, KuroTipas = KuroTipas.Elektra }
            );
        }
    }
}