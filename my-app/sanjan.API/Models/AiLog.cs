using System;
using System.Collections.Generic;

namespace Sanjan.API.Models
{
    public enum AiFeatureType
    {
        SEMANTIC_LINK,
        BRIDGE_NOTE,
        STUDY_NOTE
    }
    public enum AiLogStatus
    {
        SUCCESS,
        RETRY,
        FAILED,
        TIMEOUT,
        RATE_LIMITED
    }
    public class AiLog
    {
        public Guid LogId {get;set;}
        public Guid UserId {get;set;}
        public AiFeatureType FeatureType {get;set;}
        public AiLogStatus Status {get;set;}
        public string? PromptUsed {get; set;}
        public string? ResponseRaw {get;set;}
        public short RetryCount {get;set;}
        public int? LatencyMs {get;set;}
        public DateTime CreatedAt {get;set;}
        public User User {get; set;} = null!;
    }
}