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
    public class RoutesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoutesController> _logger;

        public RoutesController(ApplicationDbContext context, ILogger<RoutesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/marsrutai
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MarsrutasDto>>> GetRoutes([FromQuery] string? search)
        {
            try
            {
                var query = _context.Marsrutai.AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(m =>
                        m.Numeris.ToString().Contains(search) ||
                        m.Pavadinimas.Contains(search) ||
                        m.PradziosStotele.Contains(search) ||
                        m.PabaigosStotele.Contains(search));
                }

                var routes = await query
                    .Select(m => new MarsrutasDto
                    {
                        Numeris = m.Numeris,
                        Pavadinimas = m.Pavadinimas,
                        PradziosStotele = m.PradziosStotele,
                        PabaigosStotele = m.PabaigosStotele,
                        BendrasAtstumas = m.BendrasAtstumas,
                        SukurimoData = m.SukurimoData,
                        AtnaujinimoData = m.AtnaujinimoData,
                        Stoteles = m.MarstrutoStoteles
                            .OrderBy(ms => ms.EilesNr)
                            .Select(ms => new MarstrutoStoteleDto
                            {
                                Id = ms.Id,
                                StotelesPavadinimas = ms.StotelesPavadinimas,
                                EilesNr = ms.EilesNr,
                                AtvykimoLaikas = ms.AtvykimoLaikas,
                                IsvykimoLaikas = ms.IsvykimoLaikas,
                                AtstumasNuoPradzios = ms.AtstumasNuoPradzios
                            }).ToList()
                    })
                    .ToListAsync();

                return Ok(routes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching routes");
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // GET: api/marsrutai/{numeris}
        [HttpGet("{numeris}")]
        public async Task<ActionResult<MarsrutasDto>> GetRoute(int numeris)
        {
            try
            {
                var route = await _context.Marsrutai
                    .Where(m => m.Numeris == numeris)
                    .Select(m => new MarsrutasDto
                    {
                        Numeris = m.Numeris,
                        Pavadinimas = m.Pavadinimas,
                        PradziosStotele = m.PradziosStotele,
                        PabaigosStotele = m.PabaigosStotele,
                        BendrasAtstumas = m.BendrasAtstumas,
                        SukurimoData = m.SukurimoData,
                        AtnaujinimoData = m.AtnaujinimoData,
                        Stoteles = m.MarstrutoStoteles
                            .OrderBy(ms => ms.EilesNr)
                            .Select(ms => new MarstrutoStoteleDto
                            {
                                Id = ms.Id,
                                StotelesPavadinimas = ms.StotelesPavadinimas,
                                EilesNr = ms.EilesNr,
                                AtvykimoLaikas = ms.AtvykimoLaikas,
                                IsvykimoLaikas = ms.IsvykimoLaikas,
                                AtstumasNuoPradzios = ms.AtstumasNuoPradzios
                            }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (route == null)
                    return NotFound($"Route {numeris} not found");

                return Ok(route);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching route {Numeris}", numeris);
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // POST: api/marsrutai
        [HttpPost]
        public async Task<ActionResult<MarsrutasDto>> CreateRoute(CreateMarsrutasDto dto)
        {
            try
            {
                // Check if route already exists
                if (await _context.Marsrutai.AnyAsync(m => m.Numeris == dto.Numeris))
                    return Conflict($"Route {dto.Numeris} already exists");

                // Validate stops exist
                if (!await _context.Stoteles.AnyAsync(s => s.Pavadinimas == dto.PradziosStotele))
                    return BadRequest($"Start stop '{dto.PradziosStotele}' not found");

                if (!await _context.Stoteles.AnyAsync(s => s.Pavadinimas == dto.PabaigosStotele))
                    return BadRequest($"End stop '{dto.PabaigosStotele}' not found");

                var route = new Marsrutas
                {
                    Numeris = dto.Numeris,
                    Pavadinimas = dto.Pavadinimas,
                    PradziosStotele = dto.PradziosStotele,
                    PabaigosStotele = dto.PabaigosStotele,
                    BendrasAtstumas = dto.BendrasAtstumas,
                    SukurimoData = DateTime.UtcNow,
                    AtnaujinimoData = DateTime.UtcNow
                };

                _context.Marsrutai.Add(route);

                // Add route stops if provided
                if (dto.Stoteles != null && dto.Stoteles.Any())
                {
                    foreach (var stopDto in dto.Stoteles)
                    {
                        // Validate stop exists
                        if (!await _context.Stoteles.AnyAsync(s => s.Pavadinimas == stopDto.StotelesPavadinimas))
                            return BadRequest($"Stop '{stopDto.StotelesPavadinimas}' not found");

                        var routeStop = new MarstrutoStotele
                        {
                            MarsrutoNr = route.Numeris,
                            StotelesPavadinimas = stopDto.StotelesPavadinimas,
                            EilesNr = stopDto.EilesNr,
                            AtvykimoLaikas = stopDto.AtvykimoLaikas,
                            IsvykimoLaikas = stopDto.IsvykimoLaikas,
                            AtstumasNuoPradzios = stopDto.AtstumasNuoPradzios
                        };
                        _context.MarstrutoStoteles.Add(routeStop);
                    }
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetRoute), new { numeris = route.Numeris }, new MarsrutasDto
                {
                    Numeris = route.Numeris,
                    Pavadinimas = route.Pavadinimas,
                    PradziosStotele = route.PradziosStotele,
                    PabaigosStotele = route.PabaigosStotele,
                    BendrasAtstumas = route.BendrasAtstumas,
                    SukurimoData = route.SukurimoData,
                    AtnaujinimoData = route.AtnaujinimoData
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating route");
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // PUT: api/marsrutai/{numeris}
        [HttpPut("{numeris}")]
        public async Task<IActionResult> UpdateRoute(int numeris, UpdateMarsrutasDto dto)
        {
            try
            {
                var route = await _context.Marsrutai
                    .Include(m => m.MarstrutoStoteles)
                    .FirstOrDefaultAsync(m => m.Numeris == numeris);

                if (route == null)
                    return NotFound($"Route {numeris} not found");

                // Validate stops
                if (!await _context.Stoteles.AnyAsync(s => s.Pavadinimas == dto.PradziosStotele))
                    return BadRequest($"Start stop '{dto.PradziosStotele}' not found");

                if (!await _context.Stoteles.AnyAsync(s => s.Pavadinimas == dto.PabaigosStotele))
                    return BadRequest($"End stop '{dto.PabaigosStotele}' not found");

                // Update route properties
                route.Pavadinimas = dto.Pavadinimas;
                route.PradziosStotele = dto.PradziosStotele;
                route.PabaigosStotele = dto.PabaigosStotele;
                route.BendrasAtstumas = dto.BendrasAtstumas;
                route.AtnaujinimoData = DateTime.UtcNow;

                // Update route stops if provided
                if (dto.Stoteles != null)
                {
                    // Remove existing stops
                    _context.MarstrutoStoteles.RemoveRange(route.MarstrutoStoteles);

                    // Add new stops
                    foreach (var stopDto in dto.Stoteles)
                    {
                        if (!await _context.Stoteles.AnyAsync(s => s.Pavadinimas == stopDto.StotelesPavadinimas))
                            return BadRequest($"Stop '{stopDto.StotelesPavadinimas}' not found");

                        var routeStop = new MarstrutoStotele
                        {
                            MarsrutoNr = route.Numeris,
                            StotelesPavadinimas = stopDto.StotelesPavadinimas,
                            EilesNr = stopDto.EilesNr,
                            AtvykimoLaikas = stopDto.AtvykimoLaikas,
                            IsvykimoLaikas = stopDto.IsvykimoLaikas,
                            AtstumasNuoPradzios = stopDto.AtstumasNuoPradzios
                        };
                        _context.MarstrutoStoteles.Add(routeStop);
                    }
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating route {Numeris}", numeris);
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // DELETE: api/marsrutai/{numeris}
        [HttpDelete("{numeris}")]
        public async Task<IActionResult> DeleteRoute(int numeris)
        {
            try
            {
                var route = await _context.Marsrutai.FindAsync(numeris);

                if (route == null)
                    return NotFound($"Route {numeris} not found");

                _context.Marsrutai.Remove(route);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting route {Numeris}", numeris);
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}