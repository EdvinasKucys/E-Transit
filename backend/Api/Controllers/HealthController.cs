// Controllers/HealthController.cs
using Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HealthController> _logger;

        public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            try
            {
                // Try to query the Gedimai table to verify it exists
                var count = await _context.Gedimai.CountAsync();
                
                return Ok(new
                {
                    status = "healthy",
                    message = "Database connection successful",
                    gedimai_count = count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== HEALTH CHECK ERROR ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Inner: {ex.InnerException?.Message}");
                Console.WriteLine($"Stack: {ex.StackTrace}");
                
                _logger.LogError(ex, "Health check failed");
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }
    }
}
