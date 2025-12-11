using Api.Data;
using Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<AdminSeederService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Configure PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Handle admin creation command
if (args.Length > 0 && args[0] == "create-admin")
{
    using (var scope = app.Services.CreateScope())
    {
        var seederService = scope.ServiceProvider.GetRequiredService<AdminSeederService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            string firstName = args.Length > 1 ? args[1] : "";
            string lastName = args.Length > 2 ? args[2] : "";
            string username = args.Length > 3 ? args[3] : "";
            string password = args.Length > 4 ? args[4] : "";
            string? email = args.Length > 5 ? args[5] : null;

            // Validate arguments
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) || 
                string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogError("Error: Missing required arguments");
                logger.LogError("Usage: dotnet run -- create-admin <firstName> <lastName> <username> <password> [email]");
                Environment.Exit(1);
            }

            seederService.SeedAdminAccountAsync(firstName, lastName, username, password, email).Wait();
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            logger.LogError($"Admin creation failed: {ex.Message}");
            Environment.Exit(1);
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Use CORS but NOT HTTPS redirection in development
    app.UseCors("AllowFrontend");
}
else
{
    // Only use HTTPS redirection in production
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();

app.Run();