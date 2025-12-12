namespace Api.DTOs
{
    public class StoteleDto
    {
        public string Pavadinimas { get; set; } = string.Empty;
        public string Savivaldybe { get; set; } = string.Empty;
        public float KoordinatesX { get; set; }
        public float KoordinatesY { get; set; }
        public string Tipas { get; set; } = string.Empty;
    }

    public class CreateStoteleDto
    {
        public string Pavadinimas { get; set; } = string.Empty;
        public string Savivaldybe { get; set; } = string.Empty;
        public float KoordinatesX { get; set; }
        public float KoordinatesY { get; set; }
        public string Tipas { get; set; } = string.Empty; // "Pradzios", "Tarpine", or "Pabaigos"
    }

        public class UpdateStoteleDto
    {
        public string Savivaldybe { get; set; } = string.Empty;
        public float KoordinatesX { get; set; }
        public float KoordinatesY { get; set; }
        public string Tipas { get; set; } = string.Empty; // "Pradzios", "Tarpine", or "Pabaigos"
    }
}