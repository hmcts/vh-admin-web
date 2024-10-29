using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.Controllers.ReferenceData;

[Produces("application/json")]
[Route("api/reference")]
[ApiController]
public abstract class ReferenceDataControllerBase : ControllerBase;