namespace Backend.Models;

public class IoTDevice
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public string BluetoothId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
    public Dictionary<string, string> Metadata { get; set; } = new();
    
    // For cloud nodes
    public string? CloudNodeId { get; set; }
    public List<string> AssignedSensorIds { get; set; } = new();
}

public enum DeviceStatus
{
    Offline,
    Online,
    Provisioning,
    Error
}
