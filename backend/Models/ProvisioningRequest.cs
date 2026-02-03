namespace Backend.Models;

public class ProvisioningRequest
{
    public string DeviceName { get; set; } = string.Empty;
    public string BluetoothId { get; set; } = string.Empty;
    public string DeviceType { get; set; } = "ESP32";
    public string? MacAddress { get; set; }
}

public class ProvisioningResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public IoTDevice? Device { get; set; }
}

public class AssignSensorRequest
{
    public string SensorId { get; set; } = string.Empty;
    public string CloudNodeId { get; set; } = string.Empty;
}

public class UpdateDeviceTypeRequest
{
    public string DeviceType { get; set; } = string.Empty;
}
