# ADR 0001: Action-Based Endpoints for Non-CRUD Operations

## Status

Accepted

## Date

2025-10-02

## Context

We needed to implement a dashboard duplication feature that allows authenticated users to create a copy of an existing dashboard with themselves as the owner. This raised a design question about how to structure the API endpoint in a way that balances REST principles, HATEOAS compliance, and pragmatic API design.

### Options Considered

1. **Action-based endpoint (RPC-style)**
   ```
   POST /dashboards/:id/duplicate
   ```

2. **Pure RESTful resource creation**
   ```
   POST /dashboards
   Body: { "sourceUuid": "dashboard-001", "name": "..." }
   ```

3. **Sub-resource approach**
   ```
   POST /dashboards/:id/copies
   ```

## Decision

We will use **action-based endpoints** (Option 1) for non-CRUD operations like duplication, using the pattern `POST /resource/:id/action`.

Example:
```
POST /dashboards/:id/duplicate
```

## Rationale

### Advantages

1. **Semantic Clarity**
   - The URL immediately communicates the operation's intent
   - Reduces ambiguity for API consumers
   - Self-documenting without extensive API documentation

2. **HATEOAS Compliance**
   - The duplicate action is discoverable through hypermedia links in responses
   - Clients follow `_links.duplicate.href` without constructing URLs
   - Achieves Richardson Maturity Model Level 3 (hypermedia controls)

3. **Industry Practice**
   - Major APIs (GitHub, Stripe, Twilio) use action-based endpoints for complex operations
   - Examples:
     - `POST /repos/:owner/:repo/forks` (GitHub)
     - `POST /charges/:id/refund` (Stripe)
     - `POST /messages/:id/redact` (Twilio)

4. **Developer Experience**
   - Intuitive for both API implementers and consumers
   - Reduces cognitive load when working with the API
   - Clear separation between CRUD operations and business actions

5. **Pragmatic REST**
   - Adheres to the spirit of REST (resource-oriented, stateless, hypermedia-driven)
   - Acknowledges that not all operations fit pure CRUD patterns
   - Prioritizes usability over theoretical purity

### Trade-offs

**What we gain:**
- Clear, self-documenting endpoints
- Better alignment with business domain language
- Easier to extend with more actions in the future

**What we accept:**
- URL contains a verb/action rather than only nouns/resources
- Deviates from strict REST resource-only URLs
- Potential criticism from REST purists

## Consequences

### Positive

- API consumers can immediately understand what endpoints do
- New team members can navigate the API without extensive documentation
- Consistent pattern for future non-CRUD operations (e.g., `/dashboards/:id/archive`, `/dashboards/:id/share`)

### Negative

- Need to maintain consistency: decide when to use action-based vs. pure REST patterns
- Documentation should clarify that we follow pragmatic REST, not strict REST

### Neutral

- We establish a precedent for similar operations across other domains (KPIs, Metrics)
- May need to create guidelines for when to use action-based endpoints vs. CRUD

## Implementation

Current implementation in [dashboards.controller.ts](../src/dashboards/dashboards.controller.ts):

```typescript
@Post(':id/duplicate')
@HttpCode(HttpStatus.CREATED)
async duplicate(@Param('id') id: string, @CurrentUser() currentUser: any) {
  const dashboard = await this.useCase.duplicate(id, currentUser.userId);
  return dashboard;
}
```

Hypermedia links in dashboard list responses:

```typescript
_links: {
  self: { href: `/dashboards/${dashboard.uuid}` },
  data: { href: `/dashboards/${dashboard.uuid}/data` },
  duplicate: { href: `/dashboards/${dashboard.uuid}/duplicate` },
}
```

## Guidelines for Future Use

Use action-based endpoints when:
- Operation is a complex business action (not simple CRUD)
- Operation transforms or derives from an existing resource
- Semantic clarity improves API usability
- HATEOAS links make the action discoverable

Use pure REST resource endpoints when:
- Operation is standard CRUD (Create, Read, Update, Delete)
- Creating a genuinely new, independent resource
- No transformation or derivation from existing resources

## References

- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html)
- [REST API Design - Resource Modeling](https://www.thoughtworks.com/insights/blog/rest-api-design-resource-modeling)
- GitHub API: https://docs.github.com/en/rest
- Stripe API: https://stripe.com/docs/api
