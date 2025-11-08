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
    }

    public class CreateVehicleDto
    {
        public string ValstybiniaiNum { get; set; } = string.Empty;
        public int Rida { get; set; }
        public int VietuSk { get; set; }
        public KuroTipas KuroTipas { get; set; }
    }

    public class UpdateVehicleDto
    {
        public int Rida { get; set; }
        public int VietuSk { get; set; }
        public KuroTipas KuroTipas { get; set; }
    }
}