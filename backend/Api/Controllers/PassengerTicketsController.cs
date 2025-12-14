using Api.Data;
using Api.DTOs;
using Api.Enums;
using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/passenger/tickets")]
    public class PassengerTicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const int ValidMinutes = 30;
        private const decimal BasePrice = 1.00m;

        public PassengerTicketsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST api/passenger/tickets/purchase
        [HttpPost("purchase")]
        public async Task<ActionResult<BilietasDto>> Purchase(PurchaseTicketDto dto)
        {
            decimal finalPrice = BasePrice;
            int? discountId = dto.NuolaidaId;

            if (discountId.HasValue)
            {
                var discount = await _context.Nuolaidos.FindAsync(discountId.Value);
                if (discount != null)
                {
                    finalPrice = BasePrice * (100 - discount.Procentas) / 100m;
                }
                else
                {
                    discountId = null;
                }
            }

            var ticket = new Bilietas
            {
                Id = Guid.NewGuid(),
                NaudotojasId = dto.NaudotojasId,
                PirkimoData = DateTime.UtcNow,
                BazineKaina = BasePrice,
                GalutineKaina = finalPrice,
                NuolaidaId = discountId,
                Statusas = BilietoStatusas.Nupirktas
            };

            _context.Bilietai.Add(ticket);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStatus), new { id = ticket.Id }, new BilietasDto
            {
                Id = ticket.Id,
                NaudotojasId = ticket.NaudotojasId,
                PirkimoData = ticket.PirkimoData,
                BazineKaina = ticket.BazineKaina,
                GalutineKaina = ticket.GalutineKaina,
                NuolaidaId = ticket.NuolaidaId,
                Statusas = ticket.Statusas
            });
        }

        // POST api/passenger/tickets/{id}/mark
        [HttpPost("{id:guid}/mark")]
        public async Task<ActionResult> Mark(Guid id, MarkTicketDto dto)
        {
            var ticket = await _context.Bilietai.FindAsync(id);
            if (ticket == null) return NotFound();

            if (ticket.Statusas != BilietoStatusas.Nupirktas)
                return BadRequest("Bilietas jau pažymėtas arba negaliojantis.");

            ticket.AktyvavimoData = DateTime.UtcNow;
            ticket.TransportoPriemonesKodas = dto.TransportoPriemonesKodas;
            ticket.Statusas = BilietoStatusas.Aktyvuotas;

            await _context.SaveChangesAsync();
            return Ok("Bilietas pažymėtas.");
        }

        // GET api/passenger/tickets/{id}/status
        // passenger wants to see "is my ticket valid right now?"
        [HttpGet("{id:guid}/status")]
        public async Task<ActionResult<object>> GetStatus(Guid id)
        {
            var ticket = await _context.Bilietai.FindAsync(id);
            if (ticket == null)
                return NotFound(new { valid = false, reason = "Bilietas nerastas" });

            if (ticket.Statusas != BilietoStatusas.Aktyvuotas)
                return Ok(new { valid = false, reason = "Bilietas neaktyvuotas", status = ticket.Statusas });

            var activated = ticket.AktyvavimoData ?? DateTime.MinValue;
            var expires = activated.AddMinutes(ValidMinutes);

            if (DateTime.UtcNow > expires)
            {
                ticket.Statusas = BilietoStatusas.Pasibaigęs;
                await _context.SaveChangesAsync();
                return Ok(new { valid = false, reason = "Bilieto galiojimas pasibaigęs", status = ticket.Statusas });
            }

            return Ok(new
            {
                valid = true,
                expiresAt = expires,
                status = ticket.Statusas,
                ticketId = ticket.Id
            });
        }

        // optional: GET api/passenger/tickets?user=...
        // GET api/passenger/tickets
        // GET api/passenger/tickets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BilietasDto>>> GetMyTickets([FromQuery] int? userId)
        {
            var query = _context.Bilietai.AsQueryable();

            if (userId.HasValue)
            {
                // 1. Filter directly by ID (Fast & Correct)
                query = query.Where(b => b.NaudotojasId == userId.Value);
            }

            var list = await query
                .Include(b => b.NaudotojasInfo) // Join to get the name string
                .OrderByDescending(b => b.PirkimoData)
                .Select(b => new BilietasDto
                {
                    Id = b.Id,
                    NaudotojasId = b.NaudotojasId,
                    
                    // Map the name for display purposes
                    Naudotojas = b.NaudotojasInfo != null ? b.NaudotojasInfo.Slapyvardis : "Nežinomas",

                    PirkimoData = b.PirkimoData,
                    AktyvavimoData = b.AktyvavimoData,
                    BazineKaina = b.BazineKaina,
                    GalutineKaina = b.GalutineKaina,
                    NuolaidaId = b.NuolaidaId,
                    TransportoPriemonesKodas = b.TransportoPriemonesKodas,
                    Statusas = b.Statusas
                })
                .ToListAsync();

            return Ok(list);
        }


    }
}
