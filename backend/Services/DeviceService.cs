using Backend.Models;

namespace Backend.Services;

public class AssignSensorResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CloudNodeMacAddress { get; set; }
}

public interface IDeviceService
{
    Task<IEnumerable<IoTDevice>> GetAllDevicesAsync();
    Task<IoTDevice?> GetDeviceByIdAsync(string id);
    Task<IoTDevice> RegisterDeviceAsync(ProvisioningRequest request);
    Task<bool> UpdateDeviceStatusAsync(string id, DeviceStatus status);
    Task<bool> DeleteDeviceAsync(string id);
    Task<IoTDevice?> UpdateDeviceMetadataAsync(string id, Dictionary<string, string> metadata);
    Task<AssignSensorResult> AssignSensorToCloudNodeAsync(string sensorId, string cloudNodeId);
    Task<IEnumerable<IoTDevice>> GetDevicesByTypeAsync(string deviceType);
    Task<IEnumerable<IoTDevice>> GetSensorsForCloudNodeAsync(string cloudNodeId);
}

public class DeviceService : IDeviceService
{
    private readonly List<IoTDevice> _devices = new();

    public Task<IEnumerable<IoTDevice>> GetAllDevicesAsync()
    {
        return Task.FromResult<IEnumerable<IoTDevice>>(_devices);
    }

    public Task<IoTDevice?> GetDeviceByIdAsync(string id)
    {
        var device = _devices.FirstOrDefault(d => d.Id == id);
        return Task.FromResult(device);
    }

    public Task<IoTDevice> RegisterDeviceAsync(ProvisioningRequest request)
    {
        var device = new IoTDevice
        {
            Name = request.DeviceName,
            BluetoothId = request.BluetoothId,
            DeviceType = request.DeviceType,
            MacAddress = request.MacAddress,
            Status = DeviceStatus.Provisioning
        };

        _devices.Add(device);
        return Task.FromResult(device);
    }

    public Task<bool> UpdateDeviceStatusAsync(string id, DeviceStatus status)
    {
        var device = _devices.FirstOrDefault(d => d.Id == id);
        if (device == null)
            return Task.FromResult(false);

        device.Status = status;
        device.LastSeen = DateTime.UtcNow;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteDeviceAsync(string id)
    {
        var device = _devices.FirstOrDefault(d => d.Id == id);
        if (device == null)
            return Task.FromResult(false);

        _devices.Remove(device);
        return Task.FromResult(true);
    }

    public Task<IoTDevice?> UpdateDeviceMetadataAsync(string id, Dictionary<string, string> metadata)
    {
        var device = _devices.FirstOrDefault(d => d.Id == id);
        if (device == null)
            return Task.FromResult<IoTDevice?>(null);

        foreach (var (key, value) in metadata)
        {
            device.Metadata[key] = value;
        }
        device.LastSeen = DateTime.UtcNow;
        
        return Task.FromResult<IoTDevice?>(device);
    }

    public Task<AssignSensorResult> AssignSensorToCloudNodeAsync(string sensorId, string cloudNodeId)
    {
        var sensor = _devices.FirstOrDefault(d => d.Id == sensorId);
        var cloudNode = _devices.FirstOrDefault(d => d.Id == cloudNodeId);

        if (sensor == null)
        {
            return Task.FromResult(new AssignSensorResult
            {
                Success = false,
                Message = "Sensor not found"
            });
        }

        if (cloudNode == null)
        {
            return Task.FromResult(new AssignSensorResult
            {
                Success = false,
                Message = "Cloud node not found"
            });
        }

        if (string.IsNullOrEmpty(cloudNode.MacAddress))
        {
            return Task.FromResult(new AssignSensorResult
            {
                Success = false,
                Message = "Cloud node does not have a MAC address"
            });
        }

        // Update sensor with cloud node reference
        sensor.CloudNodeId = cloudNodeId;
        sensor.Metadata["cloudNodeMAC"] = cloudNode.MacAddress;
        sensor.LastSeen = DateTime.UtcNow;

        // Add sensor to cloud node's assigned sensors list
        if (!cloudNode.AssignedSensorIds.Contains(sensorId))
        {
            cloudNode.AssignedSensorIds.Add(sensorId);
        }

        return Task.FromResult(new AssignSensorResult
        {
            Success = true,
            Message = $"Sensor assigned to cloud node successfully",
            CloudNodeMacAddress = cloudNode.MacAddress
        });
    }

    public Task<IEnumerable<IoTDevice>> GetDevicesByTypeAsync(string deviceType)
    {
        var devices = _devices.Where(d => d.DeviceType == deviceType);
        return Task.FromResult<IEnumerable<IoTDevice>>(devices);
    }

    public Task<IEnumerable<IoTDevice>> GetSensorsForCloudNodeAsync(string cloudNodeId)
    {
        var sensors = _devices.Where(d => d.CloudNodeId == cloudNodeId);
        return Task.FromResult<IEnumerable<IoTDevice>>(sensors);
    }
}
