using Sanjan.API.Models;

namespace Sanjan.API.Services
{
    public interface IAiLogService
    {
        Task<AiLog> CreateLogAsync(Guid userId, AiFeatureType featureType, AiLogStatus status, string? promptUsed, string? responseRaw, short retryCount, int? latencyMs);
        Task<IEnumerable<AiLog>> GetUserLogsAsync(Guid userId);
    }
}