using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("vairuotojas")]
    public class Vairuotojas
    {
        [Key]
        [Column("id_naudotojas")]
        public int IdNaudotojas { get; set; }

        [Column("vairavimo_stazas")]
        public float? VairavimosStazas { get; set; }

        // Navigation property
        [ForeignKey(nameof(IdNaudotojas))]
        public Naudotojas? Naudotojas { get; set; }
    }
}
