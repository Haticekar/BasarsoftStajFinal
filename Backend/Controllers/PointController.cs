using Backend.Models;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class PointController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public PointController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet("fromdatabase")]
    public async Task<ActionResult<Response<IEnumerable<Point>>>> GetAllFromDatabase()
    {
        var points = await _unitOfWork.PointService.GetAllAsync();
        return Ok(points);
    }

    [HttpGet("fromdatabase/{id}")]
    public async Task<ActionResult<Response<Point>>> GetByIdFromDatabase(int id)
    {
        var point = await _unitOfWork.PointService.GetByIdAsync(id);
        if (!point.Status)
        {
            return NotFound(point);
        }
        return Ok(point);
    }

    [HttpPost("fromdatabase")]
    public async Task<ActionResult<Response<Point>>> CreatePoint([FromBody] Point newPoint)
    {
        var response = await _unitOfWork.PointService.AddAsync(newPoint);
        await _unitOfWork.SaveChangesAsync();  // Committing changes using Unit of Work
        return CreatedAtAction(nameof(GetByIdFromDatabase), new { id = response.Value.Id }, response);
    }

    [HttpPut("fromdatabase/{id}")]
    public async Task<ActionResult<Response<Point>>> UpdatePoint(int id, [FromBody] Point updatePoint)
    {
        var response = await _unitOfWork.PointService.UpdateAsync(id, updatePoint);
        if (!response.Status)
        {
            return NotFound(response);
        }
        await _unitOfWork.SaveChangesAsync();  // Committing changes using Unit of Work
        return Ok(response);
    }

    [HttpDelete("fromdatabase/{id}")]
    public async Task<ActionResult<Response<bool>>> DeletePoint(int id)
    {
        var response = await _unitOfWork.PointService.DeleteAsync(id);
        if (!response.Status)
        {
            return NotFound(response);
        }
        await _unitOfWork.SaveChangesAsync();  // Committing changes using Unit of Work
        return Ok(response);
    }
}
