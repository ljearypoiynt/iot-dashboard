using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class SensorData
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(100)]
    public string DeviceId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string DeviceName { get; set; } = string.Empty;
    
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    
    // Store as JSON string in database
    [Column(TypeName = "jsonb")]
    public string DataJson { get; set; } = "{}";
    
    [NotMapped]
    public Dictionary<string, object> Data
    {
        get => string.IsNullOrEmpty(DataJson) 
            ? new Dictionary<string, object>() 
            : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(DataJson) ?? new();
        set => DataJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
    
    // Navigation property
    [ForeignKey(nameof(DeviceId))]
    public IoTDevice? Device { get; set; }
}

public class SensorDataRequest
{
    public string DeviceId { get; set; } = string.Empty;
    public Dictionary<string, object> Data { get; set; } = new();
}

public class SensorDataResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public SensorData? Data { get; set; }
}
