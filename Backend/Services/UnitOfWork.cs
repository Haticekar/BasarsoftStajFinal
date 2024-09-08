
using Backend.Data;
using Backend.Interfaces;

namespace Backend.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly PointContext _context;

        public UnitOfWork(PointContext context)
        {
            _context = context;
        }

        public IGenericService<T> Repository<T>() where T : class  // Updated use RepositoryService
        {
            return new GenericService<T>(_context); 
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose() 
        {
            _context.Dispose();
        }

        IGenericService<T> IUnitOfWork.Repository<T>()
        {
            throw new NotImplementedException();
        }
        
    }
}
