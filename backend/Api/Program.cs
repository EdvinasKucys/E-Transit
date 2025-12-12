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

// Load .env file if present and set environment variables
try
{
    var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");
    if (File.Exists(envPath))
    {
        var lines = File.ReadAllLines(envPath);
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
            var idx = line.IndexOf('=');
            if (idx <= 0) continue;
            var key = line[..idx].Trim();
            var value = line[(idx + 1)..].Trim();
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
catch
{
    // ignore .env parsing errors, will fallback to appsettings.json
}

// Build connection string from environment variables if available
string? dbHost = Environment.GetEnvironmentVariable("DB_HOST");
string? dbPort = Environment.GetEnvironmentVariable("DB_PORT");
string? dbName = Environment.GetEnvironmentVariable("DB_NAME");
string? dbUser = Environment.GetEnvironmentVariable("DB_USER");
string? dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

string? envConnection = null;
if (!string.IsNullOrWhiteSpace(dbHost) && !string.IsNullOrWhiteSpace(dbName) && !string.IsNullOrWhiteSpace(dbUser))
{
    envConnection = $"Host={dbHost};Port={(string.IsNullOrWhiteSpace(dbPort) ? "5432" : dbPort)};Database={dbName};Username={dbUser};Password={dbPassword};Ssl Mode=Disable";
}

// Configure PostgreSQL using env connection string if provided, else fallback to appsettings.json
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(envConnection ?? builder.Configuration.GetConnectionString("DefaultConnection")));

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