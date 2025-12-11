// Controllers/GedimasController.cs
using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GedimasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<GedimasController> _logger;

        public GedimasController(ApplicationDbContext context, ILogger<GedimasController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("vehicle/{valstybiniaiNum}")]
        public async Task<ActionResult<IEnumerable<GedimasDto>>> GetVehicleGedimai(string valstybiniaiNum)
        {
            try
            {
                var gedimai = await _context.Gedimai
                    .Where(g => g.FkTransportoPriemoneValstybiniaiNum == valstybiniaiNum)
                    .OrderByDescending(g => g.Data)
                    .Select(g => new GedimasDto
                    {
                        IdGedimas = g.IdGedimas,
                        Data = g.Data,
                        Komentaras = g.Komentaras,
                        GedimoTipas = g.GedimoTipas,
                        GedimoBusena = g.GedimoBusena,
                        ValstybiniaiNum = g.FkTransportoPriemoneValstybiniaiNum
                    })
                    .ToListAsync();

                return Ok(gedimai);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching gedimai for vehicle {ValstybiniaiNum}", valstybiniaiNum);
                return StatusCode(500, new { message = "Failed to fetch malfunctions" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<GedimasDto>> CreateGedimas([FromBody] CreateGedimasDto createDto)
        {
            try
            {
                Console.WriteLine($"=== CREATE GEDIMAS ENDPOINT CALLED ===");
                Console.WriteLine($"Vehicle: {createDto.ValstybiniaiNum}, Type: {createDto.GedimoTipas}");

                // Verify vehicle exists
                var vehicle = await _context.TransportoPriemones
                    .FirstOrDefaultAsync(v => v.ValstybiniaiNum == createDto.ValstybiniaiNum);

                if (vehicle == null)
                {
                    return NotFound(new { message = "Vehicle not found" });
                }

                // Verify driver is assigned to this vehicle
                Request.Headers.TryGetValue("X-User-Id", out var userIdHeader);
                if (int.TryParse(userIdHeader.ToString(), out var driverId))
                {
                    if (vehicle.FkVairuotojasIdNaudotojas != driverId)
                    {
                        Console.WriteLine($"Authorization failed - driver {driverId} is not assigned to vehicle {createDto.ValstybiniaiNum}");
                        return StatusCode(403, new { message = "You can only report malfunctions for your assigned vehicle" });
                    }
                }

                var gedimas = new Gedimas
                {
                    Data = DateTime.UtcNow, // Use UTC DateTime to avoid PostgreSQL type mismatch
                    Komentaras = createDto.Komentaras,
                    GedimoTipas = createDto.GedimoTipas,
                    GedimoBusena = "Nesutvarkyta", // Default status
                    FkTransportoPriemoneValstybiniaiNum = createDto.ValstybiniaiNum
                };

                Console.WriteLine($"Creating Gedimas with values:");
                Console.WriteLine($"  Data: {gedimas.Data} (Kind: {gedimas.Data?.Kind ?? DateTimeKind.Unspecified})");
                Console.WriteLine($"  Komentaras: {gedimas.Komentaras}");
                Console.WriteLine($"  GedimoTipas: {gedimas.GedimoTipas}");
                Console.WriteLine($"  GedimoBusena: {gedimas.GedimoBusena}");
                Console.WriteLine($"  FkTransportoPriemoneValstybiniaiNum: {gedimas.FkTransportoPriemoneValstybiniaiNum}");

                _context.Gedimai.Add(gedimas);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Created malfunction record with ID: {gedimas.IdGedimas}");

                var responseDto = new GedimasDto
                {
                    IdGedimas = gedimas.IdGedimas,
                    Data = gedimas.Data,
                    Komentaras = gedimas.Komentaras,
                    GedimoTipas = gedimas.GedimoTipas,
                    GedimoBusena = gedimas.GedimoBusena,
                    ValstybiniaiNum = gedimas.FkTransportoPriemoneValstybiniaiNum
                };

                return CreatedAtAction(nameof(GetVehicleGedimai), new { valstybiniaiNum = createDto.ValstybiniaiNum }, responseDto);
            }
            catch (DbUpdateException dbEx)
            {
                Console.WriteLine($"=== DATABASE UPDATE ERROR ===");
                Console.WriteLine($"Error: {dbEx.Message}");
                Console.WriteLine($"Inner: {dbEx.InnerException?.Message}");
                
                if (dbEx.InnerException is PostgresException pgEx)
                {
                    Console.WriteLine($"PostgreSQL Error: {pgEx.MessageText}");
                    Console.WriteLine($"Detail: {pgEx.Detail}");
                }
                
                _logger.LogError(dbEx, "Database error creating gedimas");
                return StatusCode(500, new { message = $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== CREATE GEDIMAS ERROR ===");
                Console.WriteLine($"Error: {ex.Message}");
                
                // Log all inner exceptions
                var innerEx = ex.InnerException;
                while (innerEx != null)
                {
                    Console.WriteLine($"Inner Exception: {innerEx.Message}");
                    innerEx = innerEx.InnerException;
                }
                
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                _logger.LogError(ex, "Error creating gedimas");
                return StatusCode(500, new { message = $"Failed to create malfunction record: {ex.InnerException?.Message ?? ex.Message}" });
            }
        }

        [HttpPut("{id}/resolve")]
        public async Task<ActionResult<GedimasDto>> ResolveGedimas(int id)
        {
            try
            {
                Console.WriteLine($"=== RESOLVE GEDIMAS CALLED === ID: {id}");

                var gedimas = await _context.Gedimai.FirstOrDefaultAsync(g => g.IdGedimas == id);
                if (gedimas == null)
                {
                    return NotFound(new { message = "Malfunction not found" });
                }

                // Mark as resolved
                gedimas.GedimoBusena = "Sutvarkyta";
                await _context.SaveChangesAsync();

                var dto = new GedimasDto
                {
                    IdGedimas = gedimas.IdGedimas,
                    Data = gedimas.Data,
                    Komentaras = gedimas.Komentaras,
                    GedimoTipas = gedimas.GedimoTipas,
                    GedimoBusena = gedimas.GedimoBusena,
                    ValstybiniaiNum = gedimas.FkTransportoPriemoneValstybiniaiNum
                };

                return Ok(dto);
            }
            catch (DbUpdateException dbEx)
            {
                Console.WriteLine($"=== DATABASE UPDATE ERROR (RESOLVE) ===");
                Console.WriteLine($"Error: {dbEx.Message}");
                Console.WriteLine($"Inner: {dbEx.InnerException?.Message}");
                _logger.LogError(dbEx, "Database error resolving gedimas");
                return StatusCode(500, new { message = $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== RESOLVE GEDIMAS ERROR ===");
                Console.WriteLine($"Error: {ex.Message}");
                _logger.LogError(ex, "Error resolving gedimas");
                return StatusCode(500, new { message = $"Failed to resolve malfunction: {ex.Message}" });
            }
        }
    }

    public class CreateGedimasDto
    {
        public string ValstybiniaiNum { get; set; } = string.Empty;
        public string? GedimoTipas { get; set; }
        public string? Komentaras { get; set; }
    }

    public class GedimasDto
    {
        public int IdGedimas { get; set; }
        public DateTime? Data { get; set; }
        public string? Komentaras { get; set; }
        public string? GedimoTipas { get; set; }
        public string? GedimoBusena { get; set; }
        public string? ValstybiniaiNum { get; set; }
    }
}
