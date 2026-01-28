using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class IoTDevice
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string DeviceType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string BluetoothId { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string? IpAddress { get; set; }
    
    [MaxLength(50)]
    public string? MacAddress { get; set; }
    
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
    
    // Store as JSON string in database
    [Column(TypeName = "jsonb")]
    public string MetadataJson { get; set; } = "{}";
    
    [NotMapped]
    public Dictionary<string, string> Metadata
    {
        get => string.IsNullOrEmpty(MetadataJson) 
            ? new Dictionary<string, string>() 
            : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(MetadataJson) ?? new();
        set => MetadataJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
    
    // For cloud nodes
    [MaxLength(100)]
    public string? CloudNodeId { get; set; }
    
    // Store as JSON string in database
    [Column(TypeName = "jsonb")]
    public string AssignedSensorIdsJson { get; set; } = "[]";
    
    [NotMapped]
    public List<string> AssignedSensorIds
    {
        get => string.IsNullOrEmpty(AssignedSensorIdsJson) 
            ? new List<string>() 
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(AssignedSensorIdsJson) ?? new();
        set => AssignedSensorIdsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
    
    // Navigation property
    public ICollection<SensorData> SensorData { get; set; } = new List<SensorData>();
}

public enum DeviceStatus
{
    Offline,
    Online,
    Provisioning,
    Error
}
