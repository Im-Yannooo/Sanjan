using System;
using System.Collections.Generic;

namespace Sanjan.API.Models
{
    public class RefreshToken
    {
        public Guid TokenId {get;set;}
        public Guid UserId {get; set;}
        public string TokenHash{get;set;} = null!;
        public DateTime IssuedAt{get;set;}
        public DateTime ExpiresAt{get;set;}
        public DateTime? RevokedAt{get;set;}
        public Guid? ReplacedByTokenId{get;set;}
        public User User { get; set; } = null!;
        public RefreshToken? ReplacedByToken { get; set; }
    }
}