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

                bool isExhausted = status == AiLogStatus.RATE_LIMITED || 
                                   request.ResponseRaw?.Contains("429") == true || 
                                   request.ResponseRaw?.ToLowerInvariant().Contains("exhaust") == true || 
                                   request.ResponseRaw?.ToLowerInvariant().Contains("quota") == true ||
                                   request.ResponseRaw?.ToLowerInvariant().Contains("token") == true;

                if (isExhausted)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("\n==================================================");
                    Console.WriteLine("[🚨 GEMINI ALERT]: API IS OUT OF TOKENS / RATE LIMITED!");
                    Console.WriteLine($"Feature: {featureType}");
                    Console.WriteLine($"Error Details: {request.ResponseRaw}");
                    Console.WriteLine("==================================================\n");
                    Console.ResetColor();
                }

                try
                {
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
                catch (Exception dbEx)
                {
                    return Ok(new { message = "Logged to terminal, database insert skipped/failed", error = dbEx.Message });
                }
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