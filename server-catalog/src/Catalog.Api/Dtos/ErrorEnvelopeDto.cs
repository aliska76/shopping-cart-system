using System.Text.Json.Serialization;

namespace Catalog.Api.Dtos;

/// <summary>
/// The one error shape this API ever returns -- ExceptionHandlingMiddleware (unhandled
/// exceptions) and the rate limiter's OnRejected handler (429s, see RateLimitingExtensions)
/// both serialize this same type, so there's exactly one envelope to document in Swagger and
/// exactly one to handle on the client, not one ad hoc shape per failure path. Mirrors
/// server-orders' AllExceptionsFilter envelope field-for-field (see architecture.md's
/// cross-service error contract) -- [JsonPropertyName] keeps the wire format lowercase
/// (status/message/errors) despite the PascalCase C# property names.
/// </summary>
public sealed class ErrorEnvelopeDto
{
    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("errors")]
    public string[] Errors { get; set; } = Array.Empty<string>();
}
