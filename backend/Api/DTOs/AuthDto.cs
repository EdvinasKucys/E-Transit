namespace Api.DTOs
{
    public class LoginRequest
    {
        public string Slapyvardis { get; set; } = string.Empty;
        public string Slaptazodis { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public int IdNaudotojas { get; set; }
        public string Vardas { get; set; } = string.Empty;
        public string Pavarde { get; set; } = string.Empty;
        public string? ElPastas { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Slapyvardis { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Vardas { get; set; } = string.Empty;
        public string Pavarde { get; set; } = string.Empty;
        public DateTime? GimimoData { get; set; }
        public string? Miestas { get; set; }
        public string? ElPastas { get; set; }
        public string Slapyvardis { get; set; } = string.Empty;
        public string Slaptazodis { get; set; } = string.Empty;
        public string? Role { get; set; } // For worker creation (Vairuotojas, Administratorius, Kontrolierius)
        
        // Driver-specific fields (only used when Role = "Vairuotojas")
        public string? PastoKodas { get; set; }
        public string? Adresas { get; set; }
        public string? AsmenKodas { get; set; }
        public float? VairavimosStazas { get; set; }
    }

    public class RegisterResponse
    {
        public int IdNaudotojas { get; set; }
        public string Slapyvardis { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
