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

        // User management
        public DbSet<Naudotojas> Naudotojai { get; set; }
        public DbSet<Keleivis> Keleivis { get; set; }
        public DbSet<Darbuotojas> Darbuotojai { get; set; }
        public DbSet<Vairuotojas> Vairuotojai { get; set; }

        // Update DbSet to use TransportoPriemone
        public DbSet<TransportoPriemone> TransportoPriemones { get; set; }

        // Update DbSet to use ticketing
        public DbSet<Nuolaida> Nuolaidos  { get; set; } = null!;
        public DbSet<Bilietas> Bilietai { get; set; }

        public DbSet<TicketPrice> TicketPrices { get; set; } = null!;



        // Update DbSet to use Routes
        public DbSet<Marsrutas> Marsrutai { get; set; }
        public DbSet<Stotele> Stoteles { get; set; }
        public DbSet<MarstrutoStotele> MarstrutoStoteles { get; set; }
        public DbSet<Tvarkarastis> Tvarkarastiai { get; set; }

        // Maintenance
        public DbSet<Gedimas> Gedimai { get; set; }
        public DbSet<Sanaudos> Sanaudos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Stotele>()
                .Property(s => s.Tipas)
                .HasConversion<string>();

            modelBuilder.Entity<Stotele>()
                .HasMany(s => s.MarstrutoStoteles)
                .WithOne(ms => ms.Stotele)
                .HasForeignKey(ms => ms.StotelesPavadinimas)
                .HasPrincipalKey(s => s.Pavadinimas);
            
            modelBuilder.Entity<Tvarkarastis>()
                .Property(t => t.DienosTipas)
                .HasConversion<string>()
                .HasMaxLength(50);


            modelBuilder.Entity<Tvarkarastis>()
                .HasOne(t => t.TransportoPriemone)
                .WithMany()
                .HasForeignKey(t => t.TransportoPriemonesKodas)
                .HasPrincipalKey(tp => tp.ValstybiniaiNum);



            // Configure the enum to be stored as string in database
            modelBuilder.Entity<TransportoPriemone>()
                .Property(v => v.KuroTipas)
                .HasConversion<string>()
                .HasMaxLength(20);

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

            modelBuilder.Entity<Nuolaida>().HasData(
                new Nuolaida { Id = 1, Pavadinimas = "Studentas", Procentas = 50 },
                new Nuolaida { Id = 2, Pavadinimas = "Senjoras", Procentas = 80 }
            );
        }
    }
}