using Microsoft.AspNetCore.Mvc;
using Sanjan.API.Models;
using Sanjan.API.Services;

namespace Sanjan.API.Controllers
{
    [ApiController]
    [Route("api/v1/ai")]
    public class AiLogController : ControllerBase
    {
        private readonly IAiLogService _aiLogService;

        public AiLogController(IAiLogService aiLogService)
        {
            _aiLogService = aiLogService;
        }

        [HttpPost("log")]
        public async Task<IActionResult> CreateLog([FromBody] CreateAiLogRequest request)
        {
            try
            {
                var featureType = Enum.Parse<AiFeatureType>(request.FeatureType);
                var status = Enum.Parse<AiLogStatus>(request.Status);

                var log = await _aiLogService.CreateLogAsync(
                    request.UserId,
                    featureType,
                    status,
                    request.PromptUsed,
                    request.ResponseRaw,
                    request.RetryCount,
                    request.LatencyMs
                );
                return Ok(new { message = "AI log created successfully", logId = log.LogId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("logs/{userId}")]
        public async Task<IActionResult> GetUserLogs(Guid userId)
        {
            try
            {
                var logs = await _aiLogService.GetUserLogsAsync(userId);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }

    public record CreateAiLogRequest(
    Guid UserId,
    string FeatureType,
    string Status,
    string? PromptUsed,
    string? ResponseRaw,
    short RetryCount,
    int? LatencyMs
    );
}