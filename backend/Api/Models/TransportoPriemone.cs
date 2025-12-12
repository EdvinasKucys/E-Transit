// Models/TransportoPriemone.cs
using Api.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("transporto_priemone")]
    public class TransportoPriemone
    {
        [Key]
        [Required]
        [StringLength(20)]
        [Column("valstybiniai_num")]
        public string ValstybiniaiNum { get; set; } = string.Empty;

        [Required]
        [Column("rida")]
        public int Rida { get; set; }

        [Required]
        [Column("vietu_sk")]
        public int VietuSk { get; set; }

        [Required]
        [Column("kuro_tipas")]
        public KuroTipas KuroTipas { get; set; }

        [Column("fk_vairuotojas_id_naudotojas")]
        public int? FkVairuotojasIdNaudotojas { get; set; }

        [Column("fk_marsrutas_numeris")]
        public int? FkMarsrutasNumeris { get; set; }

        // Navigation properties
        [ForeignKey("FkVairuotojasIdNaudotojas")]
        public Naudotojas? Vairuotojas { get; set; }

        [ForeignKey("FkMarsrutasNumeris")]
        public Marsrutas? Marsrutas { get; set; }
    }
}
