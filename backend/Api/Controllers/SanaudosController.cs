using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SanaudosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SanaudosController> _logger;

        public SanaudosController(ApplicationDbContext context, ILogger<SanaudosController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/sanaudos/stats
        // Get fuel consumption statistics for all vehicles
        [HttpGet("stats")]
        public async Task<ActionResult<List<VehicleFuelStatsDto>>> GetAllVehicleFuelStats(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                _logger.LogInformation("Fetching fuel stats for all vehicles. StartDate: {StartDate}, EndDate: {EndDate}", 
                    startDate, endDate);

                var query = _context.Sanaudos
                    .Include(s => s.TransportoPriemone)
                    .AsQueryable();

                if (startDate.HasValue)
                {
                    query = query.Where(s => s.Data >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(s => s.Data <= endDate.Value);
                }

                var sanaudosData = await query
                    .OrderBy(s => s.Data)
                    .ToListAsync();

                var vehicleStats = sanaudosData
                    .GroupBy(s => s.FkTransportoPriemoneValstybiniaiNum)
                    .Select(g =>
                    {
                        var vehicle = g.First().TransportoPriemone;
                        var totalFuel = g.Sum(s => s.KuroKiekis ?? 0);
                        var totalDistance = g.Sum(s => s.NukeliautasAtstumas ?? 0);
                        var avgConsumption = totalDistance > 0 
                            ? (totalFuel / totalDistance) * 100 
                            : 0;

                        return new VehicleFuelStatsDto
                        {
                            ValstybiniaiNum = g.Key,
                            KuroTipas = vehicle?.KuroTipas.ToString() ?? "Unknown",
                            FuelData = g.Select(s => new FuelDataPointDto
                            {
                                Data = s.Data ?? DateTime.MinValue,
                                KuroKiekis = s.KuroKiekis ?? 0,
                                NukeliautasAtstumas = s.NukeliautasAtstumas ?? 0
                            }).ToList(),
                            TotalFuelUsed = totalFuel,
                            TotalDistance = totalDistance,
                            AverageConsumption = avgConsumption
                        };
                    })
                    .ToList();

                _logger.LogInformation("Successfully fetched fuel stats for {Count} vehicles", vehicleStats.Count);
                return Ok(vehicleStats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fuel stats");
                return StatusCode(500, new { message = "Error fetching fuel statistics", error = ex.Message });
            }
        }

        // GET: api/sanaudos/vehicle/{valstybiniaiNum}
        // Get fuel consumption data for a specific vehicle
        [HttpGet("vehicle/{valstybiniaiNum}")]
        public async Task<ActionResult<VehicleFuelStatsDto>> GetVehicleFuelStats(
            string valstybiniaiNum,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                _logger.LogInformation("Fetching fuel stats for vehicle {VehicleNum}", valstybiniaiNum);

                var vehicle = await _context.TransportoPriemones
                    .FirstOrDefaultAsync(v => v.ValstybiniaiNum == valstybiniaiNum);

                if (vehicle == null)
                {
                    return NotFound(new { message = $"Vehicle {valstybiniaiNum} not found" });
                }

                var query = _context.Sanaudos
                    .Where(s => s.FkTransportoPriemoneValstybiniaiNum == valstybiniaiNum);

                if (startDate.HasValue)
                {
                    query = query.Where(s => s.Data >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(s => s.Data <= endDate.Value);
                }

                var sanaudosData = await query
                    .OrderBy(s => s.Data)
                    .ToListAsync();

                var totalFuel = sanaudosData.Sum(s => s.KuroKiekis ?? 0);
                var totalDistance = sanaudosData.Sum(s => s.NukeliautasAtstumas ?? 0);
                var avgConsumption = totalDistance > 0 
                    ? (totalFuel / totalDistance) * 100 
                    : 0;

                var stats = new VehicleFuelStatsDto
                {
                    ValstybiniaiNum = valstybiniaiNum,
                    KuroTipas = vehicle.KuroTipas.ToString(),
                    FuelData = sanaudosData.Select(s => new FuelDataPointDto
                    {
                        Data = s.Data ?? DateTime.MinValue,
                        KuroKiekis = s.KuroKiekis ?? 0,
                        NukeliautasAtstumas = s.NukeliautasAtstumas ?? 0
                    }).ToList(),
                    TotalFuelUsed = totalFuel,
                    TotalDistance = totalDistance,
                    AverageConsumption = avgConsumption
                };

                _logger.LogInformation("Successfully fetched fuel stats for vehicle {VehicleNum}", valstybiniaiNum);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fuel stats for vehicle {VehicleNum}", valstybiniaiNum);
                return StatusCode(500, new { message = "Error fetching fuel statistics", error = ex.Message });
            }
        }

        // POST: api/sanaudos
        // Create a new fuel consumption record
        [HttpPost]
        public async Task<ActionResult<SanaudosDto>> CreateSanaudos([FromBody] CreateSanaudosDto dto)
        {
            try
            {
                _logger.LogInformation("Creating fuel consumption record for vehicle {VehicleNum}", dto.ValstybiniaiNum);

                var vehicle = await _context.TransportoPriemones
                    .FirstOrDefaultAsync(v => v.ValstybiniaiNum == dto.ValstybiniaiNum);

                if (vehicle == null)
                {
                    return NotFound(new { message = $"Vehicle {dto.ValstybiniaiNum} not found" });
                }

                var sanaudos = new Sanaudos
                {
                    // Ensure UTC kind or map to date only
                    Data = DateTime.SpecifyKind(dto.Data, DateTimeKind.Utc),
                    NukeliautasAtstumas = dto.NukeliautasAtstumas,
                    KuroKiekis = dto.KuroKiekis,
                    FkTransportoPriemoneValstybiniaiNum = dto.ValstybiniaiNum
                };

                _context.Sanaudos.Add(sanaudos);
                await _context.SaveChangesAsync();

                var result = new SanaudosDto
                {
                    IdSanaudos = sanaudos.IdSanaudos,
                    Data = sanaudos.Data,
                    NukeliautasAtstumas = sanaudos.NukeliautasAtstumas,
                    KuroKiekis = sanaudos.KuroKiekis,
                    FkTransportoPriemoneValstybiniaiNum = sanaudos.FkTransportoPriemoneValstybiniaiNum
                };

                _logger.LogInformation("Successfully created fuel consumption record with ID {Id}", sanaudos.IdSanaudos);
                return CreatedAtAction(nameof(GetVehicleFuelStats), 
                    new { valstybiniaiNum = dto.ValstybiniaiNum }, 
                    result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating fuel consumption record");
                return StatusCode(500, new { message = "Error creating fuel consumption record", error = ex.Message });
            }
        }
    }
}
