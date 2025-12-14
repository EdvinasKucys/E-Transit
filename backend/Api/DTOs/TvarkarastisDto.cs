namespace Api.DTOs
{
    public class TvarkarastisDto
    {
        public int Id { get; set; }
        public string Pavadinimas { get; set; } = "";
        public int MarsrutoNr { get; set; }
        public TimeSpan AtvykimoLaikas { get; set; }
        public TimeSpan IsvykimoLaikas { get; set; }
        public string DienosTipas { get; set; } = "";
        public string? TransportoPriemonesKodas { get; set; }
    }

    public class CreateTvarkarastisDto
    {
        public string Pavadinimas { get; set; } = string.Empty;
        public int MarsrutoNr { get; set; }
        public TimeSpan AtvykimoLaikas { get; set; }
        public TimeSpan IsvykimoLaikas { get; set; }
        public string DienosTipas { get; set; } = string.Empty;

        public string? TransportoPriemonesKodas { get; set; }
    }

}