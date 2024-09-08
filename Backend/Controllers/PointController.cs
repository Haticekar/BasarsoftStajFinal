using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PointController : ControllerBase
    {
        private readonly IGenericService<Point> _pointService;

        public PointController(IGenericService<Point> pointService)
        {
            _pointService = pointService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var points = await _pointService.GetAllAsync();
                return Ok(points);
            }
            catch (System.Exception)
            {
                return StatusCode(500, new { message = "An error occurred." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var point = await _pointService.GetByIdAsync(id);
                if (point == null)
                {
                    return NotFound(new { message = "Point not found." });
                }
                return Ok(point);
            }
            catch (System.Exception)
            {
                return StatusCode(500, new { message = "An error occurred." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Point point)
        {
            try
            {
                if (point == null)
                {
                    return BadRequest(new { message = "Invalid data." });
                }

                var createdPoint = await _pointService.AddAsync(point);
                return CreatedAtAction(nameof(GetById), new { id = createdPoint.Value.UniqueId }, createdPoint);
            }
            catch (System.Exception)
            {
                return StatusCode(500, new { message = "An error occurred while creating." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] Point point)
        {
            try
            {
                if (point == null || id != point.UniqueId)
                {
                    return BadRequest(new { message = "Invalid data." });
                }

                var existingPoint = await _pointService.GetByIdAsync(id);
                if (existingPoint == null)
                {
                    return NotFound(new { message = "Point not found." });
                }

                await _pointService.UpdateAsync(id, point);
                return Ok(new { message = "Point updated." });
            }
            catch (System.Exception)
            {
                return StatusCode(500, new { message = "An error occurred while updating." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                var point = await _pointService.GetByIdAsync(id);
                if (point == null)
                {
                    return NotFound(new { message = "Point not found." });
                }

                var result = await _pointService.DeleteAsync(id);
                if (!result.Status)
                {
                    return StatusCode(500, new { message = "An error occurred while deleting." });
                }

                return Ok(new { message = "Point deleted." });
            }
            catch (System.Exception)
            {
                return StatusCode(500, new { message = "An error occurred while deleting." });
            }
        }
    }
}
