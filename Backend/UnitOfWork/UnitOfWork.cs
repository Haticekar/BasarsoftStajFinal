using Backend.Data;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.UnitOfWork;
public class UnitOfWork : IUnitOfWork
{
    private readonly PointContext _context;
    private IGenericService<Point> _pointService;

    public UnitOfWork(PointContext context, IGenericService<Point> pointService)
    {
        _context = context;
        _pointService = pointService;
    }
    public IGenericService<Point> PointService => _pointService;


    public void Dispose()
    {
       _context.Dispose();
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}