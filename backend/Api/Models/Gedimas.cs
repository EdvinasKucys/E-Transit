// Models/Gedimas.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("gedimas")]
    public class Gedimas
    {
        [Key]
        [Column("id_gedimas")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdGedimas { get; set; }

        [Column("data")]
        public DateTime? Data { get; set; }

        [Column("komentaras")]
        [StringLength(255)]
        public string? Komentaras { get; set; }

        [Column("gedimo_tipas")]
        [StringLength(50)]
        public string? GedimoTipas { get; set; }

        [Column("gedimo_busena")]
        [StringLength(50)]
        public string? GedimoBusena { get; set; }

        [Column("fk_transporto_priemone_valstybiniai_num")]
        [StringLength(255)]
        [Required]
        public string FkTransportoPriemoneValstybiniaiNum { get; set; } = string.Empty;

        // Navigation property
        [ForeignKey("FkTransportoPriemoneValstybiniaiNum")]
        public TransportoPriemone? TransportoPriemone { get; set; }
    }
}
