namespace Backend.Models;

public class SensorData
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Data { get; set; } = new();
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
