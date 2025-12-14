using Api.Data;
using Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/inspector/tickets")]
    public class TicketValidationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const int ValidMinutes = 30;

        public TicketValidationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST api/inspector/tickets/{id}/validate
        [HttpPost("{id:guid}/validate")]
        public async Task<ActionResult<object>> Validate(Guid id, ValidateTicketDto dto)
        {
            var ticket = await _context.Bilietai.FindAsync(id);
            if (ticket == null)
                return NotFound(new { valid = false, reason = "Bilietas nerastas" });

            if (ticket.Statusas != Enums.BilietoStatusas.Aktyvuotas)
                return Ok(new { valid = false, reason = "Bilietas neaktyvuotas" });

            var activated = ticket.AktyvavimoData ?? DateTime.MinValue;
            var expires = activated.AddMinutes(ValidMinutes);

            if (DateTime.UtcNow > expires)
            {
                ticket.Statusas = Enums.BilietoStatusas.Pasibaigęs;
                await _context.SaveChangesAsync();
                return Ok(new { valid = false, reason = "Bilieto galiojimas pasibaigęs" });
            }

            if (!string.IsNullOrWhiteSpace(dto.TransportoPriemonesKodas) &&
                !string.IsNullOrWhiteSpace(ticket.TransportoPriemonesKodas) &&
                !string.Equals(dto.TransportoPriemonesKodas, ticket.TransportoPriemonesKodas, StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { valid = false, reason = "Pažymėta kitoje transporto priemonėje" });
            }

            return Ok(new
            {
                valid = true,
                expiresAt = expires,
                ticketId = ticket.Id,
                user = ticket.NaudotojasId,
                discountId = ticket.NuolaidaId
            });
        }
    }
}
