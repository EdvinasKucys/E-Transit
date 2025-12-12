using Api.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("marsruto_stotele")]
    public class MarstrutoStotele
    {
        [Key]
        [Column("id_marsruto_stotele")]
        public int Id { get; set; }

        [Required]
        [Column("fk_marsrutas_numeris")]
        public int MarsrutoNr { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("fk_stotele_pavadinimas")]
        public string StotelesPavadinimas { get; set; } = string.Empty;

        [Required]
        [Column("eiles_nr")]
        public int EilesNr { get; set; }

        [Column("atvykimo_laikas")]
        public TimeSpan? AtvykimoLaikas { get; set; }

        [Column("isvykimo_laikas")]
        public TimeSpan? IsvykimoLaikas { get; set; }

        [Column("atstumas_nuo_pradzios")]
        public float? AtstumasNuoPradzios { get; set; }

        // Navigation properties
        [ForeignKey(nameof(MarsrutoNr))]
        public Marsrutas? Marsrutas { get; set; }

        [ForeignKey(nameof(StotelesPavadinimas))]
        public Stotele? Stotele { get; set; }
    }
}