using Backend.Interfaces;
using Backend.Models;

public interface IUnitOfWork : IDisposable
{
    IGenericService<Point> PointService { get; }
    Task<int> SaveChangesAsync();
}
