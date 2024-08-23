using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Backend.UnitOfWork;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddDbContext<PointContext>(options=>
options.UseNpgsql(builder.Configuration.GetConnectionString("DefauktConnection")));
builder.Services.AddScoped<IGenericService<Point>, PointService>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IGenericService<>),typeof(GenericService<>));



builder.Services.AddScoped(typeof(IGenericService<>),typeof(GenericService<>));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
