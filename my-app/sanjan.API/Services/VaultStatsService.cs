using Microsoft.EntityFrameworkCore;
using Sanjan.API.Data;
using Sanjan.API.Models;

namespace Sanjan.API.Services
{
    public class VaultStatsService : IVaultStatsService
    {
        private readonly SanjanDbContext _context;

        public VaultStatsService(SanjanDbContext context)
        {
            _context = context;
        }

        public async Task<UserVaultStats> SyncStatsAsync(Guid userId, int totalNotes, int totalBridgeNotes, int totalStudyNotes, int totalLinks)
        {
            var stats = await _context.UserVaultStats
                .FirstOrDefaultAsync(v => v.UserId == userId);

            if (stats == null)
            {
                stats = new UserVaultStats
                {
                    UserId = userId,
                    TotalNotes = totalNotes,
                    TotalBridgeNotes = totalBridgeNotes,
                    TotalStudyNotes = totalStudyNotes,
                    TotalLinks = totalLinks,
                    LastVaultSyncAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserVaultStats.Add(stats);
            }
            else
            {
                stats.TotalNotes = totalNotes;
                stats.TotalBridgeNotes = totalBridgeNotes;
                stats.TotalStudyNotes = totalStudyNotes;
                stats.TotalLinks = totalLinks;
                stats.LastVaultSyncAt = DateTime.UtcNow;
                stats.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return stats;
        }

        public async Task<UserVaultStats?> GetStatsAsync(Guid userId)
        {
            return await _context.UserVaultStats
                .FirstOrDefaultAsync(v => v.UserId == userId);
        }
    }
}