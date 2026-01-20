using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly IDeviceService _deviceService;
    private readonly ILogger<DevicesController> _logger;

    public DevicesController(IDeviceService deviceService, ILogger<DevicesController> logger)
    {
        _deviceService = deviceService;
        _logger = logger;
    }

    /// <summary>
    /// Get all registered devices
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IoTDevice>>> GetDevices()
    {
        var devices = await _deviceService.GetAllDevicesAsync();
        return Ok(devices);
    }

    /// <summary>
    /// Get a specific device by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<IoTDevice>> GetDevice(string id)
    {
        var device = await _deviceService.GetDeviceByIdAsync(id);
        if (device == null)
        {
            return NotFound(new { message = "Device not found" });
        }
        return Ok(device);
    }

    /// <summary>
    /// Register a new device
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ProvisioningResponse>> RegisterDevice([FromBody] ProvisioningRequest request)
    {
        try
        {
            _logger.LogInformation("Registering device: {DeviceName}", request.DeviceName);
            
            var device = await _deviceService.RegisterDeviceAsync(request);
            
            return Ok(new ProvisioningResponse
            {
                Success = true,
                Message = "Device registered successfully",
                Device = device
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register device");
            return BadRequest(new ProvisioningResponse
            {
                Success = false,
                Message = $"Failed to register device: {ex.Message}"
            });
        }
    }

    /// <summary>
    /// Update device status
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateDeviceStatus(string id, [FromBody] DeviceStatus status)
    {
        var updated = await _deviceService.UpdateDeviceStatusAsync(id, status);
        if (!updated)
        {
            return NotFound(new { message = "Device not found" });
        }
        return Ok(new { message = "Device status updated" });
    }

    /// <summary>
    /// Update device metadata
    /// </summary>
    [HttpPut("{id}/metadata")]
    public async Task<ActionResult<IoTDevice>> UpdateDeviceMetadata(
        string id, 
        [FromBody] Dictionary<string, string> metadata)
    {
        var device = await _deviceService.UpdateDeviceMetadataAsync(id, metadata);
        if (device == null)
        {
            return NotFound(new { message = "Device not found" });
        }
        return Ok(device);
    }

    /// <summary>
    /// Assign a sensor to a cloud node
    /// </summary>
    [HttpPost("assign-sensor")]
    public async Task<ActionResult> AssignSensorToCloudNode([FromBody] AssignSensorRequest request)
    {
        try
        {
            _logger.LogInformation("Assigning sensor {SensorId} to cloud node {CloudNodeId}", 
                request.SensorId, request.CloudNodeId);
            
            var result = await _deviceService.AssignSensorToCloudNodeAsync(
                request.SensorId, request.CloudNodeId);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }
            
            return Ok(new 
            { 
                message = result.Message,
                cloudNodeMacAddress = result.CloudNodeMacAddress
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign sensor to cloud node");
            return BadRequest(new { message = $"Failed to assign sensor: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get all cloud nodes
    /// </summary>
    [HttpGet("cloud-nodes")]
    public async Task<ActionResult<IEnumerable<IoTDevice>>> GetCloudNodes()
    {
        var devices = await _deviceService.GetDevicesByTypeAsync("CloudNode");
        return Ok(devices);
    }

    /// <summary>
    /// Get all sensors assigned to a cloud node
    /// </summary>
    [HttpGet("cloud-nodes/{cloudNodeId}/sensors")]
    public async Task<ActionResult<IEnumerable<IoTDevice>>> GetSensorsForCloudNode(string cloudNodeId)
    {
        var sensors = await _deviceService.GetSensorsForCloudNodeAsync(cloudNodeId);
        return Ok(sensors);
    }

    /// <summary>
    /// Delete a device
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDevice(string id)
    {
        var deleted = await _deviceService.DeleteDeviceAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = "Device not found" });
        }
        return Ok(new { message = "Device deleted successfully" });
    }
}
