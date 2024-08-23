using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;
public class PointContext : DbContext
{
    public PointContext (DbContextOptions<PointContext> options) : base(options) {}
    public DbSet<Point> Points {get;set;}
}
