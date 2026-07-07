using System;
using System.Collections.Generic;

namespace Sanjan.API.Models
{
    public class User
    {
        public Guid UserId {get; set;}
        public string Email {get; set;} = null!;
        public string PasswordHash {get; set;} = null!;
        public string? DisplayName {get; set;}
        public DateTime CreatedAt {get; set;} 
        public DateTime UpdatedAt {get; set;}
        public DateTime? LastLoginAt {get; set;}
        public bool IsActive{get; set;}
        public ICollection<RefreshToken> RefreshTokens  {get;set;} = new List<RefreshToken>();
        public ICollection<AiLog> AiLogs {get; set;} = new List<AiLog>();
        public UserVaultStats? VaultStats{get; set;}
    }
}