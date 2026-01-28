using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<IoTDevice> Devices { get; set; }
    public DbSet<SensorData> SensorData { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure IoTDevice
        modelBuilder.Entity<IoTDevice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BluetoothId);
            entity.HasIndex(e => e.MacAddress);
            entity.Property(e => e.Status)
                .HasConversion<string>();
        });

        // Configure SensorData
        modelBuilder.Entity<SensorData>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DeviceId);
            entity.HasIndex(e => e.ReceivedAt);
            
            entity.HasOne(e => e.Device)
                .WithMany(d => d.SensorData)
                .HasForeignKey(e => e.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
