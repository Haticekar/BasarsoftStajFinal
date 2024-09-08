using Backend.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IGenericService<T> Repository<T>() where T : class;  // Updated to return IRepositoryService<T>
    Task<int> SaveChangesAsync();
}
