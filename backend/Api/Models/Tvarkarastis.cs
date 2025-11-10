using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Api.Enums;

namespace Api.Models
{
    [Table("tvarkarastis")]
    public class Tvarkarastis
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("marsruto_nr")]
        public string MarsrutoNr { get; set; } = string.Empty;

        [MaxLength(200)]
        [Column("pavadinimas")]
        public string? Pavadinimas { get; set; }

        [Required]
        [Column("atvykimo_laikas")]
        public TimeSpan AtvykimoLaikas { get; set; }

        [Required]
        [Column("isvykimo_laikas")]
        public TimeSpan IsvykimoLaikas { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("dienos_tipas")]
        public DienosTipas DienosTipas { get; set; } // Darbo_diena, Savaitgalis, Sventine_diena

        [MaxLength(20)]
        [Column("transporto_priemones_kodas")]
        public string? TransportoPriemonesKodas { get; set; }

        // Navigation properties
        [ForeignKey(nameof(MarsrutoNr))]
        public Marsrutas? Marsrutas { get; set; }

        [ForeignKey(nameof(TransportoPriemonesKodas))]
        public TransportoPriemone? TransportoPriemone { get; set; }
    }
}
