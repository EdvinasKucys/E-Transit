using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("darbuotojas")]
    public class Darbuotojas
    {
        [Key]
        [Column("id_naudotojas")]
        public int IdNaudotojas { get; set; }

        [Column("pasto_kodas")]
        public string? PastoKodas { get; set; }

        [Column("adresas")]
        public string? Adresas { get; set; }

        [Column("asmens_kodas")]
        public string? AsmenKodas { get; set; }

        // Navigation property
        [ForeignKey(nameof(IdNaudotojas))]
        public Naudotojas? Naudotojas { get; set; }
    }
}
