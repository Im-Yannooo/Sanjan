using Microsoft.AspNetCore.Mvc;
using Sanjan.API.Services;

namespace Sanjan.API.Controllers
{
    [ApiController]
    [Route("api/v1/vault")]
    public class VaultStatsController : ControllerBase
    {
        private readonly IVaultStatsService _vaultStatsService;

        public VaultStatsController(IVaultStatsService vaultStatsService)
        {
            _vaultStatsService = vaultStatsService;
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncStats([FromBody] SyncStatsRequest request)
        {
            try
            {
                var stats = await _vaultStatsService.SyncStatsAsync(
                    request.UserId,
                    request.TotalNotes,
                    request.TotalBridgeNotes,
                    request.TotalStudyNotes,
                    request.TotalLinks
                );
                return Ok(new { message = "Vault stats synced successfully", stats });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("stats/{userId}")]
        public async Task<IActionResult> GetStats(Guid userId)
        {
            try
            {
                var stats = await _vaultStatsService.GetStatsAsync(userId);
                if (stats == null)
                    return NotFound(new { message = "No stats found for this user." });
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public record SyncStatsRequest(
        Guid UserId,
        int TotalNotes,
        int TotalBridgeNotes,
        int TotalStudyNotes,
        int TotalLinks
    );
}