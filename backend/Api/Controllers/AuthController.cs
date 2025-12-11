using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.DTOs;
using Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get list of worker accounts (non-passengers)
        /// </summary>
        [HttpGet("workers")]
        public async Task<ActionResult<IEnumerable<WorkerDto>>> GetWorkers()
        {
            try
            {
                // Simple authorization: require admin role in header
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    return StatusCode(403, new { message = "Admin authorization required" });
                }
                var workers = await _context.Naudotojai
                    .Where(n => n.Role != null && n.Role != "Keleivis")
                    .Select(n => new WorkerDto
                    {
                        IdNaudotojas = n.IdNaudotojas,
                        Vardas = n.Vardas ?? string.Empty,
                        Pavarde = n.Pavarde ?? string.Empty,
                        Slapyvardis = n.Slapyvardis ?? string.Empty,
                        Role = n.Role ?? string.Empty,
                        ElPastas = n.ElPastas,
                    })
                    .ToListAsync();

                return Ok(workers);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Get workers error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch workers" });
            }
        }

        /// <summary>
        /// Update worker role
        /// </summary>
        [HttpPatch("workers/{id}/role")]
        public async Task<ActionResult> UpdateWorkerRole(int id, [FromBody] UpdateRoleRequest request)
        {
            try
            {
                // Simple authorization: require admin role in header
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    return StatusCode(403, new { message = "Admin authorization required" });
                }
                string? newRole = request.Role;

                if (string.IsNullOrWhiteSpace(newRole))
                {
                    return BadRequest(new { message = "Role is required" });
                }

                var validRoles = new[] { "Vairuotojas", "Kontrolierius", "Administratorius" };
                if (!validRoles.Contains(newRole))
                {
                    return BadRequest(new { message = "Invalid role" });
                }

                var user = await _context.Naudotojai.FirstOrDefaultAsync(n => n.IdNaudotojas == id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Do not allow changing passengers here
                if (user.Role == "Keleivis")
                {
                    return BadRequest(new { message = "Cannot change passenger role via this endpoint" });
                }

                user.Role = newRole;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Role updated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update worker role error for user {UserId}", id);
                return StatusCode(500, new { message = "Failed to update role" });
            }
        }

        /// <summary>
        /// Delete worker account
        /// </summary>
        [HttpDelete("workers/{id}")]
        public async Task<ActionResult> DeleteWorker(int id)
        {
            try
            {
                // Simple authorization: require admin role in header
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    return StatusCode(403, new { message = "Admin authorization required" });
                }
                var user = await _context.Naudotojai.FirstOrDefaultAsync(n => n.IdNaudotojas == id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                if (user.Role == "Keleivis")
                {
                    return BadRequest(new { message = "Cannot delete passenger via this endpoint" });
                }

                _context.Naudotojai.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Worker deleted" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Delete worker error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to delete worker" });
            }
        }

        /// <summary>
        /// Register a new passenger (Keleivis)
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Slapyvardis) || string.IsNullOrWhiteSpace(request.Slaptazodis))
                {
                    return BadRequest(new { message = "Username and password are required" });
                }

                // Check if username already exists
                var existingUser = await _context.Naudotojai
                    .FirstOrDefaultAsync(n => n.Slapyvardis == request.Slapyvardis);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "Username already exists" });
                }

                // Hash password
                var hashedPassword = HashPassword(request.Slaptazodis);

                // Create new user
                var naudotojas = new Naudotojas
                {
                    Vardas = request.Vardas,
                    Pavarde = request.Pavarde,
                    GimimoData = request.GimimoData,
                    Miestas = request.Miestas,
                    ElPastas = request.ElPastas,
                    Slapyvardis = request.Slapyvardis,
                    Slaptazodis = hashedPassword,
                    Role = "Keleivis"
                };

                _context.Naudotojai.Add(naudotojas);
                await _context.SaveChangesAsync();

                // Create corresponding Keleivis record
                var keleivis = new Keleivis
                {
                    IdNaudotojas = naudotojas.IdNaudotojas,
                    IdKorteles = null,
                    NuolaidosTipas = null
                };

                _context.Keleivis.Add(keleivis);
                await _context.SaveChangesAsync();

                var response = new RegisterResponse
                {
                    IdNaudotojas = naudotojas.IdNaudotojas,
                    Slapyvardis = naudotojas.Slapyvardis,
                    Role = naudotojas.Role,
                    Message = "Registration successful"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Registration error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        /// <summary>
        /// Login user
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Slapyvardis) || string.IsNullOrWhiteSpace(request.Slaptazodis))
                {
                    return BadRequest(new { message = "Username and password are required" });
                }

                // Find user by username
                var naudotojas = await _context.Naudotojai
                    .FirstOrDefaultAsync(n => n.Slapyvardis == request.Slapyvardis);

                if (naudotojas == null)
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                // Verify password
                if (string.IsNullOrEmpty(naudotojas.Slaptazodis) || !VerifyPassword(request.Slaptazodis, naudotojas.Slaptazodis))
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                var response = new LoginResponse
                {
                    IdNaudotojas = naudotojas.IdNaudotojas,
                    Vardas = naudotojas.Vardas ?? string.Empty,
                    Pavarde = naudotojas.Pavarde ?? string.Empty,
                    ElPastas = naudotojas.ElPastas,
                    Role = naudotojas.Role ?? string.Empty,
                    Slapyvardis = naudotojas.Slapyvardis ?? string.Empty
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during login" });
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

        /// <summary>
        /// Verify password against hash
        /// </summary>
        private bool VerifyPassword(string password, string hash)
        {
            byte[] hashBytes = Convert.FromBase64String(hash);
            byte[] salt = new byte[128 / 8];
            Array.Copy(hashBytes, 0, salt, 0, salt.Length);

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            byte[] computedHash = pbkdf2.GetBytes(256 / 8);

            for (int i = 0; i < computedHash.Length; i++)
            {
                if (hashBytes[i + salt.Length] != computedHash[i])
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Create a new worker account (Driver, Inspector, or Admin) - Admin only
        /// </summary>
        [HttpPost("create-worker")]
        public async Task<ActionResult<RegisterResponse>> CreateWorker([FromBody] RegisterRequest request)
        {
            try
            {
                // Simple authorization: require admin role in header
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    return StatusCode(403, new { message = "Admin authorization required" });
                }
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Slapyvardis) || string.IsNullOrWhiteSpace(request.Slaptazodis))
                {
                    return BadRequest(new { message = "Username and password are required" });
                }

                if (string.IsNullOrWhiteSpace(request.Vardas) || string.IsNullOrWhiteSpace(request.Pavarde))
                {
                    return BadRequest(new { message = "Name is required" });
                }

                // Check if username already exists
                var existingUser = await _context.Naudotojai
                    .FirstOrDefaultAsync(n => n.Slapyvardis == request.Slapyvardis);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "Username already exists" });
                }

                // Hash password
                var hashedPassword = HashPassword(request.Slaptazodis);

                // Determine role from request
                string role = request.Role ?? "Vairuotojas"; // Default to driver

                // Validate role
                var validRoles = new[] { "Vairuotojas", "Kontrolierius", "Administratorius", "Keleivis" };
                if (!validRoles.Contains(role))
                {
                    return BadRequest(new { message = "Invalid role" });
                }

                // Create new user
                var naudotojas = new Naudotojas
                {
                    Vardas = request.Vardas,
                    Pavarde = request.Pavarde,
                    GimimoData = request.GimimoData,
                    Miestas = request.Miestas,
                    ElPastas = request.ElPastas,
                    Slapyvardis = request.Slapyvardis,
                    Slaptazodis = hashedPassword,
                    Role = role
                };

                _context.Naudotojai.Add(naudotojas);
                await _context.SaveChangesAsync();

                var response = new RegisterResponse
                {
                    IdNaudotojas = naudotojas.IdNaudotojas,
                    Slapyvardis = naudotojas.Slapyvardis,
                    Role = naudotojas.Role,
                    Message = "Worker account created successfully"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Create worker error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while creating worker account" });
            }
        }
    }
}

