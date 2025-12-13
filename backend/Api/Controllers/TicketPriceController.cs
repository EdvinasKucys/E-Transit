using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/ticket-price")]
    public class TicketPriceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TicketPriceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET api/ticket-price
        [HttpGet]
        public async Task<ActionResult<TicketPrice>> Get()
        {
            var price = await _context.TicketPrices.FirstOrDefaultAsync(p => p.Id == 1);

            if (price == null)
            {
                price = new TicketPrice
                {
                    Id = 1,
                    Pavadinimas = "Vienkartinis bilietas",
                    Kaina = 1.00m
                };
                _context.TicketPrices.Add(price);
                await _context.SaveChangesAsync();
            }

            return Ok(price);
        }

        // PUT api/ticket-price
        [HttpPut]
        public async Task<ActionResult<TicketPrice>> Update([FromBody] TicketPrice dto)
        {
            var price = await _context.TicketPrices.FirstOrDefaultAsync(p => p.Id == 1);

            if (price == null)
            {
                price = new TicketPrice { Id = 1 };
                _context.TicketPrices.Add(price);
            }

            price.Pavadinimas = dto.Pavadinimas;
            price.Kaina = dto.Kaina;

            await _context.SaveChangesAsync();
            return Ok(price);
        }
    }
}
