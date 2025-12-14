using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("sanaudos")]
    public class Sanaudos
    {
        [Key]
        [Column("id_sanaudos")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdSanaudos { get; set; }

        [Column("data", TypeName = "date")]
        public DateTime? Data { get; set; }

        [Column("nukeliautas_atstumas")]
        public float? NukeliautasAtstumas { get; set; }

        [Column("kuro_kiekis")]
        public float? KuroKiekis { get; set; }

        [Column("fk_transporto_priemone_valstybiniai_num")]
        [Required]
        public string FkTransportoPriemoneValstybiniaiNum { get; set; } = string.Empty;

        [ForeignKey("FkTransportoPriemoneValstybiniaiNum")]
        public virtual TransportoPriemone? TransportoPriemone { get; set; }
    }
}
