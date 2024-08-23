using Backend.Models;

public interface IPointService
{
    List<Point> GetPointsFromDatabase();
    Point GetPointByIdFromDatabase(int id);
    Point Add(Point point);
    bool Update(int id, Point updatePoint);
    bool Delete(int id);
}
