using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Sanjan.API.Data;
using Sanjan.API.Models;

namespace Sanjan.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly SanjanDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(SanjanDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<User> RegisterAsync(string email, string password, string? displayName)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser != null)
                throw new Exception("Email already exists.");

            var user = new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                DisplayName = displayName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<AuthResult> LoginAsync(string email, string password)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                throw new Exception("Invalid email or password.");

            if (!user.IsActive)
                throw new Exception("Account is disabled.");

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.UserId);

            return new AuthResult
            {
                AccessToken = accessToken.AccessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                UserId = user.UserId,
                ExpiresAt = accessToken.ExpiresAt
            };
        }

        public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);

            var storedToken = await _context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.TokenHash == tokenHash);

            if (storedToken == null)
                throw new Exception("Invalid refresh token.");

            if (storedToken.RevokedAt != null)
                throw new Exception("Refresh token has been revoked.");

            if (storedToken.ExpiresAt < DateTime.UtcNow)
                throw new Exception("Refresh token has expired.");

            storedToken.RevokedAt = DateTime.UtcNow;

            var newRefreshToken = await GenerateRefreshTokenAsync(storedToken.UserId);

            var lastToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.TokenHash == HashToken(newRefreshToken));

            if (lastToken != null)
                storedToken.ReplacedByTokenId = lastToken.TokenId;

            await _context.SaveChangesAsync();

            var accessToken = GenerateJwtToken(storedToken.User);

            return new AuthResult
            {
                AccessToken = accessToken.AccessToken,
                RefreshToken = newRefreshToken,
                Email = storedToken.User.Email,
                UserId = storedToken.UserId,
                ExpiresAt = accessToken.ExpiresAt
            };
        }

        public async Task RevokeTokenAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);

            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.TokenHash == tokenHash);

            if (storedToken == null)
                throw new Exception("Invalid refresh token.");

            storedToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private async Task<string> GenerateRefreshTokenAsync(Guid userId)
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            var rawToken = Convert.ToBase64String(randomBytes);

            var refreshToken = new RefreshToken
            {
                UserId = userId,
                TokenHash = HashToken(rawToken),
                IssuedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return rawToken;
        }

        private string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(bytes);
        }

        private AuthResult GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;
            var issuer = jwtSettings["Issuer"]!;
            var audience = jwtSettings["Audience"]!;
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"]!);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );

            return new AuthResult
            {
                AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
                Email = user.Email,
                UserId = user.UserId,
                ExpiresAt = expiresAt
            };
        }
    }
}