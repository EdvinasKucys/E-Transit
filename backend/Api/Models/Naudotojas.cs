using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("naudotojas")]
    public class Naudotojas
    {
        [Key]
        [Column("id_naudotojas")]
        public int IdNaudotojas { get; set; }

        [Column("vardas")]
        [MaxLength(255)]
        public string? Vardas { get; set; }

        [Column("pavarde")]
        [MaxLength(255)]
        public string? Pavarde { get; set; }

        [Column("gimimo_data")]
        public DateTime? GimimoData { get; set; }

        [Column("miestas")]
        [MaxLength(255)]
        public string? Miestas { get; set; }

        [Column("el_pastas")]
        [MaxLength(255)]
        public string? ElPastas { get; set; }

        [Column("slaptazodis")]
        [MaxLength(255)]
        public string? Slaptazodis { get; set; }

        [Column("slapyvardis")]
        [MaxLength(255)]
        public string? Slapyvardis { get; set; }

        [Column("role")]
        [MaxLength(50)]
        public string? Role { get; set; }

        // Navigation property
        public Keleivis? Keleivis { get; set; }
    }
}
