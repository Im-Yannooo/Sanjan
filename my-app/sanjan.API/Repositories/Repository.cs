using Microsoft.EntityFrameworkCore;
using Sanjan.API.Data;

namespace Sanjan.API.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly SanjanDbContext context;
        private readonly DbSet<T> dbSet;

        public Repository(SanjanDbContext dbContext)
        {
            context = dbContext;
            dbSet = dbContext.Set<T>();
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await dbSet.ToListAsync();
        }

        public async Task<T?> GetByIdAsync(Guid id)
        {
            return await dbSet.FindAsync(id);
        }

        public async Task<T> CreateAsync(T entity)
        {
            await dbSet.AddAsync(entity);
            await context.SaveChangesAsync();
            return entity;
        }

        public async Task<T> UpdateAsync(T entity)
        {
            dbSet.Update(entity);
            await context.SaveChangesAsync();
            return entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                dbSet.Remove(entity);
                await context.SaveChangesAsync();
            }
        }
    }
}