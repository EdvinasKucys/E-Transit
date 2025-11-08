// Controllers/VehiclesController.cs
using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiclesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VehiclesController> _logger;

        public VehiclesController(ApplicationDbContext context, ILogger<VehiclesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleDto>>> GetVehicles()
        {
            try
            {
                _logger.LogInformation("Attempting to fetch vehicles from database");

                if (!await _context.Database.CanConnectAsync())
                {
                    _logger.LogError("Cannot connect to database");
                    return StatusCode(500, "Cannot establish database connection");
                }

                var vehicles = await _context.TransportoPriemones
                    .Select(v => new VehicleDto
                    {
                        ValstybiniaiNum = v.ValstybiniaiNum,
                        Rida = v.Rida,
                        VietuSk = v.VietuSk,
                        KuroTipas = v.KuroTipas
                    })
                    .ToListAsync();

                _logger.LogInformation("Successfully fetched {Count} vehicles", vehicles.Count);
                return Ok(vehicles);
            }
            catch (Npgsql.NpgsqlException npgsqlEx)
            {
                _logger.LogError(npgsqlEx, "PostgreSQL error occurred while fetching vehicles");
                return StatusCode(500, $"Database error: {npgsqlEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while fetching vehicles");
                return StatusCode(500, $"An unexpected error occurred: {ex.Message}");
            }
        }

        [HttpGet("{valstybiniaiNum}")]
        public async Task<ActionResult<VehicleDto>> GetVehicle(string valstybiniaiNum)
        {
            try
            {
                var vehicle = await _context.TransportoPriemones
                    .Where(v => v.ValstybiniaiNum == valstybiniaiNum)
                    .Select(v => new VehicleDto
                    {
                        ValstybiniaiNum = v.ValstybiniaiNum,
                        Rida = v.Rida,
                        VietuSk = v.VietuSk,
                        KuroTipas = v.KuroTipas
                    })
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                {
                    return NotFound();
                }

                return vehicle;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching vehicle {ValstybiniaiNum}", valstybiniaiNum);
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<VehicleDto>> PostVehicle(CreateVehicleDto createVehicleDto)
        {
            try
            {
                // Check if vehicle with this number already exists
                var existingVehicle = await _context.TransportoPriemones
                    .FirstOrDefaultAsync(v => v.ValstybiniaiNum == createVehicleDto.ValstybiniaiNum);

                if (existingVehicle != null)
                {
                    return Conflict($"Vehicle with number {createVehicleDto.ValstybiniaiNum} already exists");
                }

                var vehicle = new TransportoPriemone
                {
                    ValstybiniaiNum = createVehicleDto.ValstybiniaiNum,
                    Rida = createVehicleDto.Rida,
                    VietuSk = createVehicleDto.VietuSk,
                    KuroTipas = createVehicleDto.KuroTipas
                };

                _context.TransportoPriemones.Add(vehicle);
                await _context.SaveChangesAsync();

                var vehicleDto = new VehicleDto
                {
                    ValstybiniaiNum = vehicle.ValstybiniaiNum,
                    Rida = vehicle.Rida,
                    VietuSk = vehicle.VietuSk,
                    KuroTipas = vehicle.KuroTipas
                };

                return CreatedAtAction(nameof(GetVehicle), new { valstybiniaiNum = vehicle.ValstybiniaiNum }, vehicleDto);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error occurred while creating vehicle");
                return StatusCode(500, $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating vehicle");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPut("{valstybiniaiNum}")]
        public async Task<IActionResult> PutVehicle(string valstybiniaiNum, UpdateVehicleDto updateVehicleDto)
        {
            try
            {
                var vehicle = await _context.TransportoPriemones
                    .FirstOrDefaultAsync(v => v.ValstybiniaiNum == valstybiniaiNum);

                if (vehicle == null)
                {
                    return NotFound();
                }


                // Update all properties
                vehicle.Rida = updateVehicleDto.Rida;
                vehicle.VietuSk = updateVehicleDto.VietuSk;
                vehicle.KuroTipas = updateVehicleDto.KuroTipas;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error occurred while updating vehicle {ValstybiniaiNum}", valstybiniaiNum);
                return StatusCode(500, $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating vehicle {ValstybiniaiNum}", valstybiniaiNum);
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpDelete("{valstybiniaiNum}")]
        public async Task<IActionResult> DeleteVehicle(string valstybiniaiNum)
        {
            try
            {
                var vehicle = await _context.TransportoPriemones
                    .FirstOrDefaultAsync(v => v.ValstybiniaiNum == valstybiniaiNum);

                if (vehicle == null)
                {
                    return NotFound();
                }

                _context.TransportoPriemones.Remove(vehicle);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error occurred while deleting vehicle {ValstybiniaiNum}", valstybiniaiNum);
                return StatusCode(500, $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting vehicle {ValstybiniaiNum}", valstybiniaiNum);
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("test-connection")]
        public async Task<ActionResult> TestConnection()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();

                if (canConnect)
                {
                    var tableExists = await _context.TransportoPriemones.AnyAsync();
                    return Ok($"Database connection successful. Table exists and has data: {tableExists}");
                }
                else
                {
                    return BadRequest("Cannot connect to database");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Connection test failed: {ex.Message}");
            }
        }

        [HttpGet("health")]
        public async Task<ActionResult> HealthCheck()
        {
            try
            {
                var healthy = await _context.Database.CanConnectAsync();
                return healthy ? Ok("Healthy") : StatusCode(503, "Unhealthy");
            }
            catch (Exception ex)
            {
                return StatusCode(503, $"Unhealthy: {ex.Message}");
            }
        }
    }
}