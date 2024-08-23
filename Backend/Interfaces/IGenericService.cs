using Backend.Models;
namespace Backend.Interfaces;
public interface IGenericService<T>
{
    Task<Response<IEnumerable<T>>> GetAllAsync();
    Task<Response<T>> GetByIdAsync(int id);
    Task<Response<T>> AddAsync(T entity);
    Task<Response<T>> UpdateAsync(int id, T entity);
    Task<Response<bool>> DeleteAsync(int id);
}
