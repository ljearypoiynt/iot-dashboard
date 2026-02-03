using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

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
    Task<IoTDevice?> UpdateDeviceTypeAsync(string id, string deviceType);
    Task<AssignSensorResult> AssignSensorToCloudNodeAsync(string sensorId, string cloudNodeId);
    Task<IEnumerable<IoTDevice>> GetDevicesByTypeAsync(string deviceType);
    Task<IEnumerable<IoTDevice>> GetSensorsForCloudNodeAsync(string cloudNodeId);
    Task<SensorData> SaveSensorDataAsync(SensorDataRequest request);
    Task<IEnumerable<SensorData>> GetAllSensorDataAsync();
    Task<IEnumerable<SensorData>> GetSensorDataByDeviceIdAsync(string deviceId, int? limit = null);
    Task<IEnumerable<SensorData>> GetSensorDataByTimeRangeAsync(DateTime startTime, DateTime endTime);
}

public class DeviceService : IDeviceService
{
    private readonly ApplicationDbContext _context;

    public DeviceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<IoTDevice>> GetAllDevicesAsync()
    {
        return await _context.Devices.ToListAsync();
    }

    public async Task<IoTDevice?> GetDeviceByIdAsync(string id)
    {
        return await _context.Devices.FindAsync(id);
    }

    public async Task<IoTDevice> RegisterDeviceAsync(ProvisioningRequest request)
    {
        var device = new IoTDevice
        {
            Name = request.DeviceName,
            BluetoothId = request.BluetoothId,
            DeviceType = request.DeviceType,
            MacAddress = request.MacAddress,
            Status = DeviceStatus.Provisioning
        };

        _context.Devices.Add(device);
        await _context.SaveChangesAsync();
        return device;
    }

    public async Task<bool> UpdateDeviceStatusAsync(string id, DeviceStatus status)
    {
        var device = await _context.Devices.FindAsync(id);
        if (device == null)
            return false;

        device.Status = status;
        device.LastSeen = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteDeviceAsync(string id)
    {
        var device = await _context.Devices.FindAsync(id);
        if (device == null)
            return false;

        _context.Devices.Remove(device);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IoTDevice?> UpdateDeviceMetadataAsync(string id, Dictionary<string, string> metadata)
    {
        var device = await _context.Devices.FindAsync(id);
        if (device == null)
            return null;

        foreach (var (key, value) in metadata)
        {
            device.Metadata[key] = value;
        }
        device.LastSeen = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return device;
    }

    public async Task<IoTDevice?> UpdateDeviceTypeAsync(string id, string deviceType)
    {
        var device = await _context.Devices.FindAsync(id);
        if (device == null)
            return null;

        var oldType = device.DeviceType;
        device.DeviceType = deviceType;
        device.LastSeen = DateTime.UtcNow;

        // If changing from SensorNode to CloudNode, clear cloud node assignment
        if (oldType == "SensorNode" && deviceType == "CloudNode")
        {
            device.CloudNodeId = null;
            // Remove from old cloud node's assigned sensors list if applicable
            if (!string.IsNullOrEmpty(device.CloudNodeId))
            {
                var oldCloudNode = await _context.Devices.FindAsync(device.CloudNodeId);
                if (oldCloudNode != null && oldCloudNode.AssignedSensorIds.Contains(id))
                {
                    oldCloudNode.AssignedSensorIds.Remove(id);
                }
            }
        }

        // If changing from CloudNode to SensorNode, clear assigned sensors
        if (oldType == "CloudNode" && deviceType == "SensorNode")
        {
            // Unassign all sensors that were assigned to this cloud node
            var assignedSensors = await _context.Devices
                .Where(d => d.CloudNodeId == id)
                .ToListAsync();
            
            foreach (var sensor in assignedSensors)
            {
                sensor.CloudNodeId = null;
                sensor.Metadata.Remove("cloudNodeMAC");
            }
            
            device.AssignedSensorIds.Clear();
        }

        await _context.SaveChangesAsync();
        return device;
    }

    public async Task<AssignSensorResult> AssignSensorToCloudNodeAsync(string sensorId, string cloudNodeId)
    {
        var sensor = await _context.Devices.FindAsync(sensorId);
        var cloudNode = await _context.Devices.FindAsync(cloudNodeId);

        if (sensor == null)
        {
            return new AssignSensorResult
            {
                Success = false,
                Message = "Sensor not found"
            };
        }

        if (cloudNode == null)
        {
            return new AssignSensorResult
            {
                Success = false,
                Message = "Cloud node not found"
            };
        }

        if (string.IsNullOrEmpty(cloudNode.MacAddress))
        {
            return new AssignSensorResult
            {
                Success = false,
                Message = "Cloud node does not have a MAC address"
            };
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

        await _context.SaveChangesAsync();

        return new AssignSensorResult
        {
            Success = true,
            Message = $"Sensor assigned to cloud node successfully",
            CloudNodeMacAddress = cloudNode.MacAddress
        };
    }

    public async Task<IEnumerable<IoTDevice>> GetDevicesByTypeAsync(string deviceType)
    {
        return await _context.Devices
            .Where(d => d.DeviceType == deviceType)
            .ToListAsync();
    }

    public async Task<IEnumerable<IoTDevice>> GetSensorsForCloudNodeAsync(string cloudNodeId)
    {
        return await _context.Devices
            .Where(d => d.CloudNodeId == cloudNodeId)
            .ToListAsync();
    }

    public async Task<SensorData> SaveSensorDataAsync(SensorDataRequest request)
    {
        var device = await _context.Devices.FindAsync(request.DeviceId);
        
        var sensorData = new SensorData
        {
            DeviceId = request.DeviceId,
            DeviceName = device?.Name ?? "Unknown Device",
            ReceivedAt = DateTime.UtcNow,
            Data = request.Data
        };

        _context.SensorData.Add(sensorData);

        // Update device last seen
        if (device != null)
        {
            device.LastSeen = DateTime.UtcNow;
            device.Status = DeviceStatus.Online;
        }

        await _context.SaveChangesAsync();
        return sensorData;
    }

    public async Task<IEnumerable<SensorData>> GetAllSensorDataAsync()
    {
        return await _context.SensorData
            .OrderByDescending(d => d.ReceivedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<SensorData>> GetSensorDataByDeviceIdAsync(string deviceId, int? limit = null)
    {
        var query = _context.SensorData
            .Where(d => d.DeviceId == deviceId)
            .OrderByDescending(d => d.ReceivedAt);

        if (limit.HasValue)
        {
            return await query.Take(limit.Value).ToListAsync();
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<SensorData>> GetSensorDataByTimeRangeAsync(DateTime startTime, DateTime endTime)
    {
        return await _context.SensorData
            .Where(d => d.ReceivedAt >= startTime && d.ReceivedAt <= endTime)
            .OrderByDescending(d => d.ReceivedAt)
            .ToListAsync();
    }
}
