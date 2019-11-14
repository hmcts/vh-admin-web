using AdminWebsite.Attributes;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using NUnit.Framework;
using System.Collections.Generic;
using AdminWebsite.Models;
using AdminWebsite.UnitTests.Controllers;

namespace AdminWebsite.UnitTests.Attributes
{
    public class HearingInputSanitizerAttributeTest
    {
        private readonly HearingInputSanitizerAttribute _hearingInputSanitizerAttribute;

        public HearingInputSanitizerAttributeTest()
        {
            _hearingInputSanitizerAttribute = new HearingInputSanitizerAttribute();
        }

        [TestCase("<script>innerText</script>", "innerText")]
        public void OnActionExecuting_Strips_Out_Invalid_Characters_BookNewHearingRequest(string inputText, string expectedText)
        {
            var context = CreateBookNewHearingRequestContext(inputText);

            _hearingInputSanitizerAttribute.OnActionExecuting(context);

            var request = context.ActionArguments
                .Should().NotBeNull()
                .And.ContainKey("request")
                .WhichValue.As<BookNewHearingRequest>()
                .Should().NotBeNull()
                .And.Subject.As<BookNewHearingRequest>();

            request.Hearing_room_name.Should().BeEquivalentTo(expectedText);
            request.Hearing_venue_name.Should().BeEquivalentTo(expectedText);
            request.Other_information.Should().BeEquivalentTo(expectedText);
            request.Cases.Should().OnlyContain(x => x.Name == expectedText && x.Number == expectedText);
            request.Participants.Should().OnlyContain
            (x => 
                x.Title == expectedText && 
                x.First_name == expectedText &&
                x.Middle_names == expectedText &&
                x.Last_name == expectedText &&
                x.Display_name == expectedText &&
                x.Telephone_number == expectedText &&
                x.House_number == expectedText &&
                x.Street == expectedText &&
                x.City == expectedText &&
                x.Postcode == expectedText &&
                x.County == expectedText &&
                x.Solicitors_reference == expectedText &&
                x.Representee == expectedText &&
                x.Organisation_name == expectedText
            );
        }

        [TestCase("<script>innerText</script>", "innerText")]
        public void OnActionExecuting_Strips_Out_Invalid_Characters_EditHearingRequest(string inputText, string expectedText)
        {
            var context = EditHearingRequestRequestContext(inputText);

            _hearingInputSanitizerAttribute.OnActionExecuting(context);

            var request = context.ActionArguments
                .Should().NotBeNull()
                .And.ContainKey("request")
                .WhichValue.As<EditHearingRequest>()
                .Should().NotBeNull()
                .And.Subject.As<EditHearingRequest>();

            request.HearingRoomName.Should().BeEquivalentTo(expectedText);
            request.HearingVenueName.Should().BeEquivalentTo(expectedText);
            request.OtherInformation.Should().BeEquivalentTo(expectedText);
            request.Case.Name.Should().BeEquivalentTo(expectedText);
            request.Case.Number.Should().BeEquivalentTo(expectedText);
            request.Participants.Should().OnlyContain
            (x =>
                x.Title == expectedText &&
                x.FirstName == expectedText &&
                x.MiddleNames == expectedText &&
                x.LastName == expectedText &&
                x.DisplayName == expectedText &&
                x.TelephoneNumber == expectedText &&
                x.HouseNumber == expectedText &&
                x.Street == expectedText &&
                x.City == expectedText &&
                x.Postcode == expectedText &&
                x.County == expectedText &&
                x.SolicitorsReference == expectedText &&
                x.Representee == expectedText &&
                x.OrganisationName == expectedText
            );
        }

        private static ActionExecutingContext CreateBookNewHearingRequestContext(string text)
        {
            var actionArguments = new Dictionary<string, object>
            {
                { "request", new BookNewHearingRequest
                    {
                        Hearing_room_name = text,
                        Hearing_venue_name = text,
                        Other_information = text,
                        Cases = new List<CaseRequest>
                        {
                            new CaseRequest{Name = text, Number = text}
                        },
                        Participants = new List<BookingsAPI.Client.ParticipantRequest>
                        {
                            new BookingsAPI.Client.ParticipantRequest
                            {
                                Title = text,
                                First_name = text,
                                Middle_names = text,
                                Last_name = text,
                                Display_name = text,
                                Telephone_number = text,
                                House_number = text,
                                Street = text,
                                City = text,
                                Postcode = text,
                                County = text,
                                Solicitors_reference = text,
                                Representee = text,
                                Organisation_name = text
                            }
                        }
                    }
                }
            };
            var actionContext = new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor());
            var context = new ActionExecutingContext(actionContext, new List<IFilterMetadata>(), actionArguments, new EmptyController());

            return context;
        }

        private static ActionExecutingContext EditHearingRequestRequestContext(string text)
        {
            var actionArguments = new Dictionary<string, object>
            {
                { "request", new EditHearingRequest
                    {
                        HearingRoomName = text,
                        HearingVenueName = text,
                        OtherInformation = text,
                        Case = new EditCaseRequest
                        {
                            Name = text, Number = text
                        },
                        Participants = new List<EditParticipantRequest>
                        {
                            new EditParticipantRequest
                            {
                                Title = text,
                                FirstName = text,
                                MiddleNames = text,
                                LastName = text,
                                DisplayName = text,
                                TelephoneNumber = text,
                                HouseNumber = text,
                                Street = text,
                                City = text,
                                Postcode = text,
                                County = text,
                                SolicitorsReference = text,
                                Representee = text,
                                OrganisationName = text
                            }
                        }
                    }
                }
            };
            var actionContext = new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor());
            var context = new ActionExecutingContext(actionContext, new List<IFilterMetadata>(), actionArguments, new EmptyController());

            return context;
        }
    }
}