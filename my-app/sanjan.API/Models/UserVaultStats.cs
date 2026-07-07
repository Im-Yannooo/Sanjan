using System;

namespace Sanjan.API.Models
{
    public class UserVaultStats
    {
        public Guid UserId {get; set;}
        public int TotalNotes {get; set;}
        public int TotalBridgeNotes {get; set;}
        public int TotalStudyNotes {get;set;}
        public int TotalLinks {get;set;}
        public DateTime? LastVaultSyncAt {get;set;}
        public DateTime? LastAiCallAt {get;set;}
        public DateTime UpdatedAt {get;set;}
        public User User {get;set;} = null!;
    }
}