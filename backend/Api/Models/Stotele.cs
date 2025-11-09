using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
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