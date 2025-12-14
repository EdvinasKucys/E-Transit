using Api.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("bilietas")]
    public class Bilietas
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("fk_naudotojas_id")]
        public int? NaudotojasId { get; set; }

        [Required]
        [Column("pirkimo_data")]
        public DateTime PirkimoData { get; set; }

        [Column("aktyvavimo_data")]
        public DateTime? AktyvavimoData { get; set; }

        [Required]
        [Column("bazine_kaina")]
        public decimal BazineKaina { get; set; }

        [Required]
        [Column("galutine_kaina")]
        public decimal GalutineKaina { get; set; }

        [Column("nuolaida_id")]
        public int? NuolaidaId { get; set; }

        [ForeignKey(nameof(NuolaidaId))]
        public Nuolaida? Nuolaida { get; set; }

        [MaxLength(50)]
        [Column("transporto_priemones_kodas")]
        public string? TransportoPriemonesKodas { get; set; }

        [Required]
        [Column("statusas")]
        public BilietoStatusas Statusas { get; set; }

        [ForeignKey(nameof(NaudotojasId))]
        public virtual Naudotojas? NaudotojasInfo { get; set; } 
    }
}
