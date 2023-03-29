using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Collections.Generic;
using ValidationFailure = FluentValidation.Results.ValidationFailure;

namespace AdminWebsite.Extensions
{
    public static class ModelStateExtensions
    {
        public static void AddFluentValidationErrors(this ModelStateDictionary modelState, IEnumerable<ValidationFailure> validationFailures)
        {
            foreach (var failure in validationFailures)
            {
                modelState.AddModelError(failure.PropertyName, failure.ErrorMessage);
            }
        }
    }
}