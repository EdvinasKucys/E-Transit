using Api.Data;
using Api.DTOs;
using Api.Enums;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScheduleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ScheduleController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/Schedule
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TvarkarastisDto>>> GetSchedules()
        {
            var schedules = await _context.Tvarkarastiai
                .AsNoTracking()
                .OrderBy(t => t.MarsrutoNr)
                .ThenBy(t => t.IsvykimoLaikas)
                .Select(t => new TvarkarastisDto
                {
                    Id = t.Id,
                    Pavadinimas = t.Pavadinimas,
                    MarsrutoNr = t.MarsrutoNr,
                    AtvykimoLaikas = t.AtvykimoLaikas,
                    IsvykimoLaikas = t.IsvykimoLaikas,
                    DienosTipas = t.DienosTipas.ToString(),
                    TransportoPriemonesKodas = t.TransportoPriemonesKodas
                })
                .ToListAsync();

            return Ok(schedules);
        }

        // GET: /api/Schedule/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<TvarkarastisDto>> GetSchedule(int id)
        {
            var t = await _context.Tvarkarastiai
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (t == null) return NotFound($"Tvarkaraštis su id {id} nerastas");

            return Ok(new TvarkarastisDto
            {
                Id = t.Id,
                Pavadinimas = t.Pavadinimas,
                MarsrutoNr = t.MarsrutoNr,
                AtvykimoLaikas = t.AtvykimoLaikas,
                IsvykimoLaikas = t.IsvykimoLaikas,
                DienosTipas = t.DienosTipas.ToString(),
                TransportoPriemonesKodas = t.TransportoPriemonesKodas
            });
        }

        // POST: /api/Schedule
        [HttpPost]
        public async Task<ActionResult<TvarkarastisDto>> CreateSchedule([FromBody] CreateTvarkarastisDto dto)
        {
            // 1. Maršrutas turi egzistuoti
            var routeExists = await _context.Marsrutai.AnyAsync(r => r.Numeris == dto.MarsrutoNr);
            if (!routeExists)
                return BadRequest($"Maršrutas {dto.MarsrutoNr} neegzistuoja.");

            // 2. Dienos tipas
            if (!Enum.TryParse<Api.Enums.DienosTipas>(dto.DienosTipas, true, out var parsedDayType))
                return BadRequest("Neteisingas dienos tipas. Leistina: Darbo_diena, Savaitgalis, Sventine_diena.");

            var kodas = dto.TransportoPriemonesKodas?.Trim();

            if (!string.IsNullOrWhiteSpace(kodas))
            {
                // case-insensitive paieška (Postgres)
                var exists = await _context.TransportoPriemones
                    .AsNoTracking()
                    .AnyAsync(x => EF.Functions.ILike(x.ValstybiniaiNum, kodas));

                if (!exists)
                    return BadRequest($"Transporto priemonė '{kodas}' neegzistuoja.");
            }


            var entity = new Tvarkarastis
            {
                Pavadinimas = dto.Pavadinimas,
                MarsrutoNr = dto.MarsrutoNr,
                IsvykimoLaikas = dto.IsvykimoLaikas,
                AtvykimoLaikas = dto.AtvykimoLaikas,
                DienosTipas = parsedDayType,
                TransportoPriemonesKodas = string.IsNullOrWhiteSpace(kodas) ? null : kodas
            };

            _context.Tvarkarastiai.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSchedule), new { id = entity.Id }, new TvarkarastisDto
            {
                Id = entity.Id,
                Pavadinimas = entity.Pavadinimas,
                MarsrutoNr = entity.MarsrutoNr,
                AtvykimoLaikas = entity.AtvykimoLaikas,
                IsvykimoLaikas = entity.IsvykimoLaikas,
                DienosTipas = entity.DienosTipas.ToString()
            });
        }


        // PUT: /api/Schedule/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateSchedule(int id, [FromBody] CreateTvarkarastisDto dto)
        {
            var entity = await _context.Tvarkarastiai.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            var routeExists = await _context.Marsrutai.AnyAsync(r => r.Numeris == dto.MarsrutoNr);
            if (!routeExists)
                return BadRequest($"Maršrutas {dto.MarsrutoNr} neegzistuoja.");

            if (!Enum.TryParse<Api.Enums.DienosTipas>(dto.DienosTipas, true, out var parsedDayType))
                return BadRequest("Neteisingas dienos tipas.");

            var kodas = dto.TransportoPriemonesKodas?.Trim();

            if (!string.IsNullOrWhiteSpace(kodas))
            {
                // case-insensitive paieška (Postgres)
                var exists = await _context.TransportoPriemones
                    .AsNoTracking()
                    .AnyAsync(x => EF.Functions.ILike(x.ValstybiniaiNum, kodas));

                if (!exists)
                    return BadRequest($"Transporto priemonė '{kodas}' neegzistuoja.");
            }


            entity.Pavadinimas = dto.Pavadinimas;
            entity.MarsrutoNr = dto.MarsrutoNr;
            entity.IsvykimoLaikas = dto.IsvykimoLaikas;
            entity.AtvykimoLaikas = dto.AtvykimoLaikas;
            entity.DienosTipas = parsedDayType;
            entity.TransportoPriemonesKodas = string.IsNullOrWhiteSpace(kodas) ? null : kodas;

            await _context.SaveChangesAsync();
            return NoContent();
        }


        // DELETE: /api/Schedule/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSchedule(int id)
        {
            var entity = await _context.Tvarkarastiai.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null) return NotFound($"Tvarkaraštis su id {id} nerastas");

            _context.Tvarkarastiai.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("debug/vehicle/{kodas}")]
        public async Task<IActionResult> DebugVehicle(string kodas)
        {
            var db = await _context.Database.ExecuteSqlRawAsync("select 1");
            var exists = await _context.TransportoPriemones
                .AsNoTracking()
                .AnyAsync(x => EF.Functions.ILike(x.ValstybiniaiNum, kodas.Trim()));

            return Ok(new { kodas, exists });
        }

    }
}