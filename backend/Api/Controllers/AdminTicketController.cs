using Api.Data;
using Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/admin/tickets")]
    public class AdminTicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminTicketsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET api/admin/tickets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BilietasDto>>> GetAll()
        {
            var tickets = await _context.Bilietai
                .Include(b => b.NaudotojasInfo)
                .OrderByDescending(b => b.PirkimoData)
                .Select(b => new BilietasDto
                {
                    Id = b.Id,
                    NaudotojasId = b.NaudotojasId,
                    Naudotojas = b.NaudotojasInfo != null ? b.NaudotojasInfo.Slapyvardis : "Nežinomas" ,
                    PirkimoData = b.PirkimoData,
                    AktyvavimoData = b.AktyvavimoData,
                    BazineKaina = b.BazineKaina,
                    GalutineKaina = b.GalutineKaina,
                    NuolaidaId = b.NuolaidaId,
                    TransportoPriemonesKodas = b.TransportoPriemonesKodas,
                    Statusas = b.Statusas
                })
                .ToListAsync();

            return Ok(tickets);
        }
    }
}
