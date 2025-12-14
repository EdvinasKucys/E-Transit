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
        [Column("pavadinimas")]
        public string Pavadinimas { get; set; } = string.Empty;

        [Required]
        [Column("isvykimo_laikas")]
        public TimeSpan IsvykimoLaikas { get; set; }

        [Required]
        [Column("atvykimo_laikas")]
        public TimeSpan AtvykimoLaikas { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("dienos_tipas")]
        public DienosTipas DienosTipas { get; set; }

        [Required]
        [Column("fk_marsrutas_numeris")]
        public int MarsrutoNr { get; set; }

        [ForeignKey(nameof(MarsrutoNr))]
        public Marsrutas? Marsrutas { get; set; }

        [Column("fk_transporto_priemone")]
        public string? TransportoPriemonesKodas { get; set; }

        [ForeignKey(nameof(TransportoPriemonesKodas))]
        public TransportoPriemone? TransportoPriemone { get; set; }

    }
}
