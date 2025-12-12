namespace Api.DTOs
{
    public class WorkerDto
    {
        public int IdNaudotojas { get; set; }
        public string Vardas { get; set; } = string.Empty;
        public string Pavarde { get; set; } = string.Empty;
        public string Slapyvardis { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? ElPastas { get; set; }
    }
}
