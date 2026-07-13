using Sanjan.API.Models;

namespace Sanjan.API.Services
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(string email, string password, string? displayName);
        Task<AuthResult> LoginAsync(string email, string password);
        Task<AuthResult> RefreshTokenAsync(string refreshToken);
        Task RevokeTokenAsync(string refreshToken);
    }

    public class AuthResult
    {
        public string AccessToken { get; set; } = null!;
        public string? RefreshToken { get; set; }
        public string Email { get; set; } = null!;
        public Guid UserId { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}