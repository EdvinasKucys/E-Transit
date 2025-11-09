using Api.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("marsruto_stotele")]
    public class MarstrutoStotele
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("marsruto_nr")]
        public string MarsrutoNr { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("stoteles_pavadinimas")]
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
    
    [Table("stotele")]
    public class Stotele
    {
        [Key]
        [Required]
        [MaxLength(100)]
        [Column("pavadinimas")]
        public string Pavadinimas { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("savivaldybe")]
        public string Savivaldybe { get; set; } = string.Empty;

        [Required]
        [Column("koordinates_x")]
        public float KoordinatesX { get; set; }

        [Required]
        [Column("koordinates_y")]
        public float KoordinatesY { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("tipas")]
        public string Tipas { get; set; } = string.Empty; // Pradzios, Tarpine, Pabaigos

        // Navigation properties
        public ICollection<MarstrutoStotele> MarstrutoStoteles { get; set; } = new List<MarstrutoStotele>();
    }
}