using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("keleivis")]
    public class Keleivis
    {
        [Key]
        [Column("id_naudotojas")]
        public int IdNaudotojas { get; set; }

        [Column("id_korteles")]
        [MaxLength(255)]
        public string? IdKorteles { get; set; }

        [Column("nuolaidos_tipas")]
        [MaxLength(50)]
        public string? NuolaidosTipas { get; set; }

        // Foreign key navigation property
        [ForeignKey(nameof(IdNaudotojas))]
        public Naudotojas? Naudotojas { get; set; }
    }
}
