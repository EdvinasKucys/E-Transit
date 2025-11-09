namespace Api.DTOs
{
    public class TvarkarastisDto
    {
        public int Id { get; set; }
        public string MarsrutoNr { get; set; } = string.Empty;
        public string? Pavadinimas { get; set; }
        public TimeSpan AtvykimoLaikas { get; set; }
        public TimeSpan IsvykimoLaikas { get; set; }
        public string DienosTipas { get; set; } = string.Empty;
        public string? TransportoPriemonesKodas { get; set; }
    }

    public class CreateTvarkarastisDto
    {
        public string MarsrutoNr { get; set; } = string.Empty;
        public string? Pavadinimas { get; set; }
        public TimeSpan AtvykimoLaikas { get; set; }
        public TimeSpan IsvykimoLaikas { get; set; }
        public string DienosTipas { get; set; } = string.Empty;
        public string? TransportoPriemonesKodas { get; set; }
    }
}