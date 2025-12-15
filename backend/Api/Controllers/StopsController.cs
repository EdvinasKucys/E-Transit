using Api.Data;
using Api.DTOs;
using Api.Models;
using Api.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StopsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StopsController> _logger;

        public StopsController(ApplicationDbContext context, ILogger<StopsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/stoteles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StoteleDto>>> GetStops()
        {
            try
            {
                var stops = await _context.Stoteles
                    .Select(s => new StoteleDto
                    {
                        Pavadinimas = s.Pavadinimas,
                        Adresas = s.Adresas,
                        KoordinatesX = s.KoordinatesX,
                        KoordinatesY = s.KoordinatesY,
                        Tipas = s.Tipas.ToString() // Convert enum to string
                    })
                    .ToListAsync();

                return Ok(stops);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stops");
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // GET: api/stoteles/{pavadinimas}
        [HttpGet("{pavadinimas}")]
        public async Task<ActionResult<StoteleDto>> GetStop(string pavadinimas)
        {
            try
            {
                var stop = await _context.Stoteles
                    .Where(s => s.Pavadinimas == pavadinimas)
                    .Select(s => new StoteleDto
                    {
                        Pavadinimas = s.Pavadinimas,
                        Adresas = s.Adresas,
                        KoordinatesX = s.KoordinatesX,
                        KoordinatesY = s.KoordinatesY,
                        Tipas = s.Tipas.ToString() // Convert enum to string
                    })
                    .FirstOrDefaultAsync();

                if (stop == null)
                    return NotFound($"Stop '{pavadinimas}' not found");

                return Ok(stop);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stop {Pavadinimas}", pavadinimas);
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // POST: api/stoteles
        [HttpPost]
        public async Task<ActionResult<StoteleDto>> CreateStop(CreateStoteleDto dto)
        {
            try
            {
                if (await _context.Stoteles.AnyAsync(s => s.Pavadinimas == dto.Pavadinimas))
                    return Conflict($"Stop '{dto.Pavadinimas}' already exists");

                // Parse the tipas string to enum
                if (!Enum.TryParse<StotelesTipas>(dto.Tipas, out var tipas))
                {
                    return BadRequest($"Invalid stop type '{dto.Tipas}'. Valid values are: Pradzios, Tarpine, Pabaigos");
                }

                var stop = new Stotele
                {
                    Pavadinimas = dto.Pavadinimas,
                    Adresas = dto.Adresas,
                    KoordinatesX = dto.KoordinatesX,
                    KoordinatesY = dto.KoordinatesY,
                    Tipas = tipas
                };

                _context.Stoteles.Add(stop);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetStop), new { pavadinimas = stop.Pavadinimas }, new StoteleDto
                {
                    Pavadinimas = stop.Pavadinimas,
                    Adresas = stop.Adresas,
                    KoordinatesX = stop.KoordinatesX,
                    KoordinatesY = stop.KoordinatesY,
                    Tipas = stop.Tipas.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating stop");
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // PUT: api/stoteles/{pavadinimas}
        [HttpPut("{pavadinimas}")]
        public async Task<IActionResult> UpdateStop(string pavadinimas, UpdateStoteleDto dto)
        {
            try
            {
                var stop = await _context.Stoteles.FindAsync(pavadinimas);

                if (stop == null)
                    return NotFound($"Stop '{pavadinimas}' not found");

                // Parse the tipas string to enum
                if (!Enum.TryParse<StotelesTipas>(dto.Tipas, out var tipas))
                {
                    return BadRequest($"Invalid stop type '{dto.Tipas}'. Valid values are: Pradzios, Tarpine, Pabaigos");
                }

                stop.Adresas = dto.Adresas;
                stop.KoordinatesX = dto.KoordinatesX;
                stop.KoordinatesY = dto.KoordinatesY;
                stop.Tipas = tipas;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stop {Pavadinimas}", pavadinimas);
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // DELETE: api/stoteles/{pavadinimas}
        [HttpDelete("{pavadinimas}")]
        public async Task<IActionResult> DeleteStop(string pavadinimas)
        {
            try
            {
                var stop = await _context.Stoteles.FindAsync(pavadinimas);

                if (stop == null)
                {
                    return Problem(
                        title: $"Stotelė '{pavadinimas}' nerasta",
                        statusCode: StatusCodes.Status404NotFound
                    );
                }

                var usedInRoutes = await _context.Marsrutai
                    .Where(m => m.PradziosStotele == pavadinimas || m.PabaigosStotele == pavadinimas)
                    .Select(m => m.Numeris)
                    .ToListAsync();

                if (usedInRoutes.Any())
                {
                    return Problem(
                        title: $"Stotelė '{pavadinimas}' yra naudojama aktyviuose maršrutuose ir negali būti ištrinta",
                        detail: $"Stotelė naudojama maršrutuose: {string.Join(", ", usedInRoutes)}",
                        statusCode: StatusCodes.Status400BadRequest
                    );
                }

                var usedInRouteStops = await _context.MarstrutoStoteles
                    .Where(ms => ms.StotelesPavadinimas == pavadinimas)
                    .Select(ms => ms.MarsrutoNr)
                    .Distinct()
                    .ToListAsync();

                if (usedInRouteStops.Any())
                {
                    return Problem(
                        title: $"Stotelė '{pavadinimas}' yra naudojama aktyviuose maršrutuose kaip tarpinė stotelė",
                        detail: $"Stotelė naudojama maršrutuose: {string.Join(", ", usedInRouteStops)}",
                        statusCode: StatusCodes.Status400BadRequest
                    );
                }

                _context.Stoteles.Remove(stop);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Nepavyko ištrinti stotelės {Pavadinimas}", pavadinimas);
                return Problem(
                    title: "Stotelė negali būti ištrinta",
                    detail: "Stotelė vis dar naudojama sistemoje.",
                    statusCode: StatusCodes.Status400BadRequest
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Klaida trinant stotelę {Pavadinimas}", pavadinimas);
                return Problem(
                    title: "Įvyko nenumatyta klaida",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status500InternalServerError
                );
            }
        }

    }
}