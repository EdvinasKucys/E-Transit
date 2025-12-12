// DTOs/VehicleDto.cs
using Api.Enums;

namespace Api.DTOs
{
    public class VehicleDto
    {
        public string ValstybiniaiNum { get; set; } = string.Empty;
        public int Rida { get; set; }
        public int VietuSk { get; set; }
        public KuroTipas KuroTipas { get; set; }
        public int? FkVairuotojasIdNaudotojas { get; set; }
        public string? VairuotojasVardas { get; set; }
        public string? VairuotojasPavarde { get; set; }
        public int? FkMarsrutasNumeris { get; set; }
        public string? MarsrutasPavadinimas { get; set; }
    }

    public class CreateVehicleDto
    {
        public string ValstybiniaiNum { get; set; } = string.Empty;
        public int Rida { get; set; }
        public int VietuSk { get; set; }
        public KuroTipas KuroTipas { get; set; }
        public int? FkVairuotojasIdNaudotojas { get; set; }
        public int? FkMarsrutasNumeris { get; set; }
    }

    public class UpdateVehicleDto
    {
        public int Rida { get; set; }
        public int VietuSk { get; set; }
        public KuroTipas KuroTipas { get; set; }
        public int? FkVairuotojasIdNaudotojas { get; set; }
        public int? FkMarsrutasNumeris { get; set; }
    }
}
