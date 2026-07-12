using Sanjan.API.Models;

namespace Sanjan.API.Services
{
    public interface IVaultStatsService
    {
        Task<UserVaultStats> SyncStatsAsync(Guid userId, int totalNotes, int totalBridgeNotes, int totalStudyNotes, int totalLinks);
        Task<UserVaultStats?> GetStatsAsync(Guid userId);
    }
}