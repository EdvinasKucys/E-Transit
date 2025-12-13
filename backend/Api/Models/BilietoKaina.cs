using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("ticket_price")]
    public class TicketPrice
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("pavadinimas")]
        public string Pavadinimas { get; set; } = string.Empty;

        
        [Required]
        [Column("kaina")]
        public Decimal Kaina { get; set; }
    }
}
