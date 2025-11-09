namespace Api.DTOs
{
    public class MarsrutasDto
    {
        public string Numeris { get; set; } = string.Empty;
        public string Pavadinimas { get; set; } = string.Empty;
        public string PradziosStotele { get; set; } = string.Empty;
        public string PabaigosStotele { get; set; } = string.Empty;
        public float? BendrasAtstumas { get; set; }
        public DateTime SukurimoData { get; set; }
        public DateTime AtnaujinimoData { get; set; }
        public List<MarstrutoStoteleDto>? Stoteles { get; set; }
    }

    public class CreateMarsrutasDto
    {
        public string Numeris { get; set; } = string.Empty;
        public string Pavadinimas { get; set; } = string.Empty;
        public string PradziosStotele { get; set; } = string.Empty;
        public string PabaigosStotele { get; set; } = string.Empty;
        public float? BendrasAtstumas { get; set; }
        public List<CreateMarstrutoStoteleDto>? Stoteles { get; set; }
    }

    public class UpdateMarsrutasDto
    {
        public string Pavadinimas { get; set; } = string.Empty;
        public string PradziosStotele { get; set; } = string.Empty;
        public string PabaigosStotele { get; set; } = string.Empty;
        public float? BendrasAtstumas { get; set; }
        public List<CreateMarstrutoStoteleDto>? Stoteles { get; set; }
    }
}
