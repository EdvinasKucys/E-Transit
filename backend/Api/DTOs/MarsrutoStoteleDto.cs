namespace Api.DTOs
{
    public class MarstrutoStoteleDto
    {
        public int Id { get; set; }
        public string StotelesPavadinimas { get; set; } = string.Empty;
        public int EilesNr { get; set; }
        public TimeSpan? AtvykimoLaikas { get; set; }
        public TimeSpan? IsvykimoLaikas { get; set; }
        public float? AtstumasNuoPradzios { get; set; }
    }

    public class CreateMarstrutoStoteleDto
    {
        public string StotelesPavadinimas { get; set; } = string.Empty;
        public int EilesNr { get; set; }
        public TimeSpan? AtvykimoLaikas { get; set; }
        public TimeSpan? IsvykimoLaikas { get; set; }
        public float? AtstumasNuoPradzios { get; set; }
    }
}