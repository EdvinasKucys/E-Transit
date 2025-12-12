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
        /// Get list of driver accounts (role = Vairuotojas and exist in Vairuotojas table)
        /// </summary>
        [HttpGet("drivers")]
        public async Task<ActionResult<IEnumerable<WorkerDto>>> GetDrivers()
        {
            try
            {
                // Require admin role
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    return StatusCode(403, new { message = "Admin authorization required" });
                }

                // Get drivers that have entries in the Vairuotojas table
                var drivers = await _context.Naudotojai
                    .Where(n => n.Role != null && n.Role == "Vairuotojas")
                    .Join(
                        _context.Vairuotojai,
                        n => n.IdNaudotojas,
                        v => v.IdNaudotojas,
                        (n, v) => new WorkerDto
                        {
                            IdNaudotojas = n.IdNaudotojas,
                            Vardas = n.Vardas ?? string.Empty,
                            Pavarde = n.Pavarde ?? string.Empty,
                            Slapyvardis = n.Slapyvardis ?? string.Empty,
                            Role = n.Role ?? string.Empty,
                            ElPastas = n.ElPastas,
                        }
                    )
                    .ToListAsync();

                return Ok(drivers);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Get drivers error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch drivers" });
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
            Console.WriteLine($"=== DELETE WORKER ENDPOINT CALLED for ID: {id} ===");
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Simple authorization: require admin role in header
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    Console.WriteLine("Authorization failed - not admin");
                    return StatusCode(403, new { message = "Admin authorization required" });
                }
                
                var user = await _context.Naudotojai.FirstOrDefaultAsync(n => n.IdNaudotojas == id);
                if (user == null)
                {
                    Console.WriteLine($"User {id} not found");
                    return NotFound(new { message = "User not found" });
                }

                if (user.Role == "Keleivis")
                {
                    Console.WriteLine($"Cannot delete passenger {id} via worker endpoint");
                    return BadRequest(new { message = "Cannot delete passenger via this endpoint" });
                }

                Console.WriteLine($"Deleting worker: {user.Slapyvardis} (Role: {user.Role})");

                // If the worker is a driver, unassign them from any vehicles and delete Vairuotojas entry
                if (user.Role == "Vairuotojas")
                {
                    // Unassign from vehicles first
                    var assignedVehicles = await _context.TransportoPriemones
                        .Where(v => v.FkVairuotojasIdNaudotojas == id)
                        .ToListAsync();

                    if (assignedVehicles.Any())
                    {
                        Console.WriteLine($"Unassigning driver from {assignedVehicles.Count} vehicle(s)");
                        foreach (var vehicle in assignedVehicles)
                        {
                            vehicle.FkVairuotojasIdNaudotojas = null;
                            Console.WriteLine($"Unassigned driver from vehicle {vehicle.ValstybiniaiNum}");
                        }
                        await _context.SaveChangesAsync();
                    }

                    // Delete Vairuotojas entry
                    var vairuotojas = await _context.Vairuotojai.FirstOrDefaultAsync(v => v.IdNaudotojas == id);
                    if (vairuotojas != null)
                    {
                        Console.WriteLine($"Deleting Vairuotojas entry for user {id}");
                        _context.Vairuotojai.Remove(vairuotojas);
                        await _context.SaveChangesAsync();
                    }
                }

                // Delete Darbuotojas entry (all workers have this)
                var darbuotojas = await _context.Darbuotojai.FirstOrDefaultAsync(d => d.IdNaudotojas == id);
                if (darbuotojas != null)
                {
                    Console.WriteLine($"Deleting Darbuotojas entry for user {id}");
                    _context.Darbuotojai.Remove(darbuotojas);
                    await _context.SaveChangesAsync();
                }

                // Finally delete Naudotojas
                Console.WriteLine($"Deleting Naudotojas entry for user {id}");
                _context.Naudotojai.Remove(user);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                Console.WriteLine($"=== WORKER {id} DELETED SUCCESSFULLY ===");

                return Ok(new { message = "Worker deleted" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine("=== DELETE WORKER ERROR ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = $"Failed to delete worker: {ex.Message}" });
            }
        }

        /// <summary>
        /// Register a new user (passenger or worker)
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
        {
            Console.WriteLine("=== REGISTER ENDPOINT CALLED ===");
            Console.WriteLine($"Username: {request.Slapyvardis}, Role: {request.Role}");
            
            using var transaction = await _context.Database.BeginTransactionAsync();
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

                // Determine role (default to Keleivis if not specified)
                var role = string.IsNullOrWhiteSpace(request.Role) ? "Keleivis" : request.Role;

                Console.WriteLine($"Creating user with role: {role}");

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

                Console.WriteLine($"Created Naudotojas with ID: {naudotojas.IdNaudotojas}");

                // Create role-specific records
                if (role == "Keleivis")
                {
                    var keleivis = new Keleivis
                    {
                        IdNaudotojas = naudotojas.IdNaudotojas,
                        IdKorteles = null,
                        NuolaidosTipas = null
                    };
                    _context.Keleivis.Add(keleivis);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created Keleivis entry for user {naudotojas.IdNaudotojas}");
                }
                else if (role == "Vairuotojas")
                {
                    Console.WriteLine($"Creating Darbuotojas entry for driver {naudotojas.IdNaudotojas}");
                    // Create Darbuotojas entry
                    var darbuotojas = new Darbuotojas
                    {
                        IdNaudotojas = naudotojas.IdNaudotojas,
                        PastoKodas = request.PastoKodas,
                        Adresas = request.Adresas,
                        AsmenKodas = request.AsmenKodas
                    };
                    _context.Darbuotojai.Add(darbuotojas);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created Darbuotojas entry for user {naudotojas.IdNaudotojas}");

                    Console.WriteLine($"Creating Vairuotojas entry with stazas: {request.VairavimosStazas}");
                    // Create Vairuotojas entry
                    var vairuotojas = new Vairuotojas
                    {
                        IdNaudotojas = naudotojas.IdNaudotojas,
                        VairavimosStazas = request.VairavimosStazas
                    };
                    _context.Vairuotojai.Add(vairuotojas);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created Vairuotojas entry for user {naudotojas.IdNaudotojas}");
                }
                else if (role == "Administratorius" || role == "Kontrolierius")
                {
                    Console.WriteLine($"Creating Darbuotojas entry for {role} {naudotojas.IdNaudotojas}");
                    // Create Darbuotojas entry for other worker types
                    var darbuotojas = new Darbuotojas
                    {
                        IdNaudotojas = naudotojas.IdNaudotojas,
                        PastoKodas = request.PastoKodas,
                        Adresas = request.Adresas,
                        AsmenKodas = request.AsmenKodas
                    };
                    _context.Darbuotojai.Add(darbuotojas);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created Darbuotojas entry for user {naudotojas.IdNaudotojas}");
                }

                await transaction.CommitAsync();
                Console.WriteLine("=== REGISTRATION SUCCESSFUL ===");

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
                await transaction.RollbackAsync();
                Console.WriteLine("=== REGISTRATION ERROR ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = $"An error occurred during registration: {ex.Message}" });
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
            Console.WriteLine("=== CREATE WORKER ENDPOINT CALLED ===");
            Console.WriteLine($"Username: {request.Slapyvardis}, Role: {request.Role}");
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Simple authorization: require admin role in header
                if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader) || roleHeader != "Administratorius")
                {
                    Console.WriteLine("Authorization failed - not admin");
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
                var validRoles = new[] { "Vairuotojas", "Kontrolierius", "Administratorius" };
                if (!validRoles.Contains(role))
                {
                    return BadRequest(new { message = "Invalid role" });
                }

                Console.WriteLine($"Creating worker with role: {role}");

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

                Console.WriteLine($"Created Naudotojas with ID: {naudotojas.IdNaudotojas}");

                // Create Darbuotojas entry for all workers
                Console.WriteLine($"Creating Darbuotojas entry for {role} {naudotojas.IdNaudotojas}");
                var darbuotojas = new Darbuotojas
                {
                    IdNaudotojas = naudotojas.IdNaudotojas,
                    PastoKodas = request.PastoKodas,
                    Adresas = request.Adresas,
                    AsmenKodas = request.AsmenKodas
                };
                _context.Darbuotojai.Add(darbuotojas);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Created Darbuotojas entry for user {naudotojas.IdNaudotojas}");

                // Create Vairuotojas entry if role is Vairuotojas
                if (role == "Vairuotojas")
                {
                    Console.WriteLine($"Creating Vairuotojas entry with stazas: {request.VairavimosStazas}");
                    var vairuotojas = new Vairuotojas
                    {
                        IdNaudotojas = naudotojas.IdNaudotojas,
                        VairavimosStazas = request.VairavimosStazas
                    };
                    _context.Vairuotojai.Add(vairuotojas);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created Vairuotojas entry for user {naudotojas.IdNaudotojas}");
                }

                await transaction.CommitAsync();
                Console.WriteLine("=== WORKER CREATION SUCCESSFUL ===");

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
                await transaction.RollbackAsync();
                Console.WriteLine("=== WORKER CREATION ERROR ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = $"An error occurred while creating worker account: {ex.Message}" });
            }
        }
    }
}

