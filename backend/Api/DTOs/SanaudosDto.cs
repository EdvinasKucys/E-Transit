namespace Api.DTOs
{
    public class SanaudosDto
    {
        public int IdSanaudos { get; set; }
        public DateTime? Data { get; set; }
        public float? NukeliautasAtstumas { get; set; }
        public float? KuroKiekis { get; set; }
        public string FkTransportoPriemoneValstybiniaiNum { get; set; } = string.Empty;
    }

    public class CreateSanaudosDto
    {
        public DateTime Data { get; set; }
        public float NukeliautasAtstumas { get; set; }
        public float KuroKiekis { get; set; }
        public string ValstybiniaiNum { get; set; } = string.Empty;
    }

    public class VehicleFuelStatsDto
    {
        public string ValstybiniaiNum { get; set; } = string.Empty;
        public string KuroTipas { get; set; } = string.Empty;
        public List<FuelDataPointDto> FuelData { get; set; } = new List<FuelDataPointDto>();
        public float TotalFuelUsed { get; set; }
        public float TotalDistance { get; set; }
        public float AverageConsumption { get; set; } // L/100km or kWh/100km
    }

    public class FuelDataPointDto
    {
        public DateTime Data { get; set; }
        public float KuroKiekis { get; set; }
        public float NukeliautasAtstumas { get; set; }
    }
}
