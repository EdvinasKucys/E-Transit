using Api.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("marsrutas")]
    public class Marsrutas
    {
        [Key]
        [Required]
        [MaxLength(20)]
        [Column("numeris")]
        public string Numeris { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("pavadinimas")]
        public string Pavadinimas { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("pradzios_stotele")]
        public string PradziosStotele { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("pabaigos_stotele")]
        public string PabaigosStotele { get; set; } = string.Empty;

        [Column("bendras_atstumas")]
        public float? BendrasAtstumas { get; set; }

        [Column("sukurimo_data")]
        public DateTime SukurimoData { get; set; } = DateTime.UtcNow;

        [Column("atnaujinimo_data")]
        public DateTime AtnaujinimoData { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(PradziosStotele))]
        public Stotele? PradziosStoteleNav { get; set; }

        [ForeignKey(nameof(PabaigosStotele))]
        public Stotele? PabaigosStoteleNav { get; set; }

        public ICollection<MarstrutoStotele> MarstrutoStoteles { get; set; } = new List<MarstrutoStotele>();
        public ICollection<Tvarkarastis> Tvarkarastiai { get; set; } = new List<Tvarkarastis>();
    }
}