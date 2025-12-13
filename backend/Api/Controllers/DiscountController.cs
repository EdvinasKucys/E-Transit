using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/discounts")]
    public class DiscountsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DiscountsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET api/discounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NuolaidaDto>>> GetAll()
        {
            var items = await _context.Nuolaidos
                .Select(d => new NuolaidaDto
                {
                    Id = d.Id,
                    Pavadinimas = d.Pavadinimas,
                    Procentas = d.Procentas
                })
                .ToListAsync();

            return Ok(items);
        }

        // POST api/discounts
        [HttpPost]
        public async Task<ActionResult<NuolaidaDto>> Create(CreateNuolaidaDto dto)
        {
            var entity = new Nuolaida
            {
                Pavadinimas = dto.Pavadinimas,
                Procentas = dto.Procentas
            };

            _context.Nuolaidos.Add(entity);
            await _context.SaveChangesAsync();

            var result = new NuolaidaDto
            {
                Id = entity.Id,
                Pavadinimas = entity.Pavadinimas,
                Procentas = entity.Procentas
            };

            return Ok(result);
        }

        // PUT api/discounts/{id}
        [HttpPut("{id:int}")]
        public async Task<ActionResult<NuolaidaDto>> Update(int id, UpdateNuolaidaDto dto)
        {
            var entity = await _context.Nuolaidos.FindAsync(id);
            if (entity == null) return NotFound();

            entity.Pavadinimas = dto.Pavadinimas;
            entity.Procentas = dto.Procentas;
            await _context.SaveChangesAsync();

            var result = new NuolaidaDto
            {
                Id = entity.Id,
                Pavadinimas = entity.Pavadinimas,
                Procentas = entity.Procentas
            };

            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Nuolaidos.FindAsync(id);
            if (entity == null) return NotFound();

            _context.Nuolaidos.Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }

    }
}
