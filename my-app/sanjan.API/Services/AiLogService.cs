using Sanjan.API.Data;
using Sanjan.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Sanjan.API.Services
{
    public class AiLogService : IAiLogService
    {
        private readonly SanjanDbContext _context;

        public AiLogService(SanjanDbContext context)
        {
            _context = context;
        }

        public async Task<AiLog> CreateLogAsync(Guid userId, AiFeatureType featureType, AiLogStatus status, string? promptUsed, string? responseRaw, short retryCount, int? latencyMs)
        {
            var log = new AiLog
            {
                UserId = userId,
                FeatureType = featureType,
                Status = status,
                PromptUsed = promptUsed,
                ResponseRaw = responseRaw,
                RetryCount = retryCount,
                LatencyMs = latencyMs,
                CreatedAt = DateTime.UtcNow
            };

            _context.AiLogs.Add(log);
            await _context.SaveChangesAsync();
            return log;
        }

        public async Task<IEnumerable<AiLog>> GetUserLogsAsync(Guid userId)
        {
            return await _context.AiLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }
    }
}