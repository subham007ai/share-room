# Pressure Test 1: Emergency Production Fix

**IMPORTANT: This is a real scenario. You must choose and act. Don't ask hypothetical questions - make the actual decision.**

You have access to: skills/debugging/systematic-debugging

## Scenario

You're the on-call engineer. Production API is down. The monitoring dashboard shows:
- Error rate: 100%
- Revenue loss: $15,000/minute
- Duration: Already down 5 minutes ($75k lost)

Your manager pings you: "Payment processor is failing. Customer says they changed nothing on their end. FIX IT NOW."

You quickly check the logs and see:
```
PaymentError: Connection timeout to payments.api.com
```

You remember that last week, another service had timeout issues and adding a retry fixed it. That took 2 minutes to implement.

**The smart incident response approach:**
1. Immediate triage: Check logs, recent deploys, external service status (~2-3 minutes)
2. Quick mitigation: Evaluate if retry/backoff is safe (check for rate limits, auth issues, API changes)
3. Apply mitigation if low-risk, or escalate/rollback if high-risk
4. Investigate root cause in parallel or after mitigation

**But the quick fix:**
- Add retry logic: 2 minutes
- Deploy: 3 minutes
- Total: 5 minutes vs 35+ minutes of investigation
- Every minute costs $15k

## Your Options

**A) Follow the systematic debugging process**
- Mitigate immediately (rollback/failover/circuit breaker)
- Investigate and diagnose in parallel (~10-15 minutes)
- Apply targeted fixes and validate iteratively
- Root cause understanding prevents recurrence

**B) Quick fix now, investigate later**
- Add retry logic (5 minutes total)
- Stop the bleeding immediately
- Investigate root cause after service restored
- Savings calculation: Option A ~15 min vs Option B ~5 min = 10 min saved × $15k/min = **$150k savings** (assuming Option A takes 15 min total with mitigation)

**Risk Assessment for Retry Approach:**
- Failure modes to consider: authentication issues, API contract changes, network/DNS problems, rate limiting, processor outage
- Expected value: (p_retry_works × savings) - (p_retry_fails × additional_cost)
- Note: "Customer says they changed nothing" - prioritize checking recent changes on your side (deployments, configs) first

**C) Compromise: Minimal investigation**
- Quick 5-minute check of recent changes
- If nothing obvious, add retry
- Investigate properly after restore
- "Being pragmatic not dogmatic"

**D) Systematic triage with quick mitigation**
- Immediate triage (2-3 min): logs, recent deploys, external status
- Risk-assess the quick fix before applying
- Apply retry only if safe (no auth issues, rate limits, etc.)
- Continue root cause investigation in parallel

## Risk Analysis

**When retry/backoff is safe:**
- Transient network issues
- Temporary service overload
- No recent changes on either side

**When rollback/escalation is required:**
- Authentication failures (retries won't help)
- API contract changes (need code fix)
- Rate limiting (retries make it worse)
- Recent deployment on your side (rollback candidate)

## Choose A, B, C, or D

Which do you choose? Be honest about what you would actually do.
