using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;
using System.Security.Cryptography;

namespace Api.Services
{
    public class AdminSeederService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminSeederService> _logger;

        public AdminSeederService(ApplicationDbContext context, ILogger<AdminSeederService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Create an initial admin account if none exists
        /// </summary>
        public async Task SeedAdminAccountAsync(string firstName, string lastName, string username, string password, string? email = null)
        {
            try
            {
                // Check if any admin already exists
                var existingAdmin = await _context.Naudotojai
                    .FirstOrDefaultAsync(n => n.Role == "Administratorius");

                if (existingAdmin != null)
                {
                    _logger.LogInformation("Admin account already exists. Skipping seeding.");
                    return;
                }

                // Check if username already exists
                var existingUser = await _context.Naudotojai
                    .FirstOrDefaultAsync(n => n.Slapyvardis == username);

                if (existingUser != null)
                {
                    _logger.LogWarning($"Username '{username}' already exists. Please use a different username.");
                    return;
                }

                // Hash password
                var hashedPassword = HashPassword(password);

                // Create admin user
                var admin = new Naudotojas
                {
                    Vardas = firstName,
                    Pavarde = lastName,
                    Slapyvardis = username,
                    Slaptazodis = hashedPassword,
                    ElPastas = email,
                    Role = "Administratorius",
                    GimimoData = null,
                    Miestas = null
                };

                _context.Naudotojai.Add(admin);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Admin account created successfully! Username: {username}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error seeding admin account: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Hash password using PBKDF2
        /// </summary>
        private string HashPassword(string password)
        {
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            byte[] hash = pbkdf2.GetBytes(256 / 8);

            byte[] hashWithSalt = new byte[salt.Length + hash.Length];
            Array.Copy(salt, 0, hashWithSalt, 0, salt.Length);
            Array.Copy(hash, 0, hashWithSalt, salt.Length, hash.Length);

            return Convert.ToBase64String(hashWithSalt);
        }
    }
}
