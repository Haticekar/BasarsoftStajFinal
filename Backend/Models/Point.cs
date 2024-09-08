
namespace Backend.Models
{
    public class Point 
    {
        public long UniqueId { get; set; }  
        public string GeoData { get; set; }  
        public string? Title { get; set; }  

        // Parameterless constructor (for used by Entity Framework)
        public Point() { }

        // Optional constructor to manually assign a GeoData value
        public Point(string geoData)
        {
            GeoData = geoData;
        }
    }
}
