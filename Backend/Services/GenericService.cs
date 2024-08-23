using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class GenericService<T> : IGenericService<T> where T : class
{
    private readonly PointContext _context;
    private readonly DbSet<T> _dbSet;

    public GenericService(PointContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    public async Task<Response<IEnumerable<T>>> GetAllAsync()
    {
        var entities = await _dbSet.ToListAsync();
        return new Response<IEnumerable<T>>
        {
            Value = entities,
            Status = true,
            Message = $"{typeof(T).Name} entities retrieved successfully"
        };
    }

    public async Task<Response<T>> GetByIdAsync(int id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity == null)
        {
            return new Response<T>
            {
                Status = false,
                Message = $"{typeof(T).Name} with ID {id} not found"
            };
        }

        return new Response<T>
        {
            Value = entity,
            Status = true,
            Message = $"{typeof(T).Name} retrieved successfully"
        };
    }

    public async Task<Response<T>> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();

        return new Response<T>
        {
            Value = entity,
            Status = true,
            Message = $"{typeof(T).Name} created successfully"
        };
    }

    public async Task<Response<T>> UpdateAsync(int id, T entity)
    {
        var existingEntity = await _dbSet.FindAsync(id);
        if (existingEntity == null)
        {
            return new Response<T>
            {
                Status = false,
                Message = $"{typeof(T).Name} with ID {id} not found"
            };
        }

        _context.Entry(existingEntity).CurrentValues.SetValues(entity);
        await _context.SaveChangesAsync();

        return new Response<T>
        {
            Value = entity,
            Status = true,
            Message = $"{typeof(T).Name} updated successfully"
        };
    }

    public async Task<Response<bool>> DeleteAsync(int id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity == null)
        {
            return new Response<bool>
            {
                Status = false,
                Message = $"{typeof(T).Name} with ID {id} not found"
            };
        }

        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();

        return new Response<bool>
        {
            Value = true,
            Status = true,
            Message = $"{typeof(T).Name} deleted successfully"
        };
    }
}
