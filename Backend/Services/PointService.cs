using Backend.Interfaces;
using Backend.Models;
using Npgsql;

public class PointService : IGenericService<Point>
{
    private readonly string _connectionString = "Host=localhost;Database=map;Username=postgres;Password=postgresql";

    public async Task<Response<IEnumerable<Point>>> GetAllAsync()
    {
        var points = new List<Point>();

        using (var connection = new NpgsqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            using (var command = new NpgsqlCommand("SELECT * FROM Points", connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        points.Add(new Point
                        {
                            Id = reader.GetInt32(0),
                            Name = reader.IsDBNull(1) ? null : reader.GetString(1),
                            PointX = reader.GetDouble(2),
                            PointY = reader.GetDouble(3)
                        });
                    }
                }
            }
        }

        return new Response<IEnumerable<Point>>
        {
            Value = points,
            Status = true,
            Message = "Points retrieved successfully"
        };
    }

    public async Task<Response<Point>> GetByIdAsync(int id)
    {
        Point point = null;

        using (var connection = new NpgsqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            using (var command = new NpgsqlCommand("SELECT * FROM Points WHERE Id = @id", connection))
            {
                command.Parameters.AddWithValue("@id", id);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        point = new Point
                        {
                            Id = reader.GetInt32(0),
                            Name = reader.IsDBNull(1) ? null : reader.GetString(1),
                            PointX = reader.GetDouble(2),
                            PointY = reader.GetDouble(3)
                        };
                    }
                }
            }
        }

        return point != null
            ? new Response<Point> { Value = point, Status = true, Message = "Point retrieved successfully" }
            : new Response<Point> { Status = false, Message = "Point not found" };
    }

    public async Task<Response<Point>> AddAsync(Point point)
    {
        using (var connection = new NpgsqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            using (var command = new NpgsqlCommand("INSERT INTO Points (Name, PointX, PointY) VALUES (@name, @pointX, @pointY) RETURNING Id", connection))
            {
                command.Parameters.AddWithValue("@name", (object)point.Name ?? DBNull.Value);
                command.Parameters.AddWithValue("@pointX", point.PointX);
                command.Parameters.AddWithValue("@pointY", point.PointY);

                point.Id = (int)await command.ExecuteScalarAsync();
            }
        }

        return new Response<Point> { Value = point, Status = true, Message = "Point created successfully" };
    }

     public async Task<Response<Point>> UpdateAsync(int id, Point updatePoint)
    {
        using (var connection = new NpgsqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            using (var command = new NpgsqlCommand("UPDATE Points SET Name = @name, PointX = @pointX, PointY = @pointY WHERE Id = @id", connection))
            {
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@name", (object)updatePoint.Name ?? DBNull.Value);
                command.Parameters.AddWithValue("@pointX", updatePoint.PointX);
                command.Parameters.AddWithValue("@pointY", updatePoint.PointY);

                int rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0
                    ? new Response<Point> { Value = updatePoint, Status = true, Message = "Point updated successfully" }
                    : new Response<Point> { Status = false, Message = "Point not found" };
            }
        }
    }


    public async Task<Response<bool>> DeleteAsync(int id)
    {
        using (var connection = new NpgsqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            using (var command = new NpgsqlCommand("DELETE FROM Points WHERE Id = @id", connection))
            {
                command.Parameters.AddWithValue("@id", id);

                int rowsAffected = await command.ExecuteNonQueryAsync();
                return new Response<bool> { Value = rowsAffected > 0, Status = rowsAffected > 0, Message = rowsAffected > 0 ? "Point deleted successfully" : "Point not found" };
            }
        }
    }
}
