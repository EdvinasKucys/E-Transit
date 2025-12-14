using Api.Enums;

namespace Api.DTOs
{
    public class BilietasDto
    {
        public Guid Id { get; set; }
        public int? NaudotojasId { get; set; }
        public string? Naudotojas { get; set; } 
        public DateTime PirkimoData { get; set; }
        public DateTime? AktyvavimoData { get; set; }
        public decimal BazineKaina { get; set; }
        public decimal GalutineKaina { get; set; }
        public int? NuolaidaId { get; set; }
        public string? TransportoPriemonesKodas { get; set; }
        public BilietoStatusas Statusas { get; set; }
    }

    public class PurchaseTicketDto
    {
        public int? NaudotojasId { get; set; }
        public int? NuolaidaId { get; set; }
    }

    public class MarkTicketDto
    {
        public string TransportoPriemonesKodas { get; set; } = string.Empty;
    }

    public class ValidateTicketDto
    {
        public string? TransportoPriemonesKodas { get; set; }
        public int? NuolaidaId { get; set; }
    }
}
