using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Contract.V2.Requests;
using Microsoft.AspNetCore.Mvc;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;
using LinkedParticipantType = AdminWebsite.Contracts.Enums.LinkedParticipantType;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class BookNewHearingTests : HearingsControllerTests
    {
        private string _expectedUserIdentityName;

        [SetUp]
        protected override void Setup()
        {
            base.Setup();
            _expectedUserIdentityName = "created by";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(_expectedUserIdentityName);
        }
        
        [Test]
        public async Task Should_book_hearing()
        {
            // Arrange
            var bookingDetails = InitHearingForV2Test();
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = bookingDetails
            };
            
            var hearingDetailsResponse = HearingResponseV2Builder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            
            BookingsApiClient.Setup(x => x.BookNewHearingWithCodeAsync(It.IsAny<BookNewHearingRequestV2>()))
                .ReturnsAsync(hearingDetailsResponse);
            
            // Act
            var result = await Controller.Post(bookingRequest);

            // Assert
            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
            createdObjectResult.Value.Should().BeEquivalentTo(hearingDetailsResponse,
                options => options.ExcludingMissingMembers().Excluding(x => x.HearingVenueName));
            
            bookingDetails.Participants.Exists(x => string.IsNullOrWhiteSpace(x.Username)).Should().BeFalse();

            bookingDetails.CreatedBy.Should().Be(_expectedUserIdentityName);

            BookingsApiClient.Verify(x => x.BookNewHearingWithCodeAsync(It.IsAny<BookNewHearingRequestV2>()), Times.Once);
        }

        private static BookingDetailsRequest InitHearingForV2Test()
        {
            // request with existing person, new user, existing user in AD but not in persons table 
            var bookNewHearingRequest = new BookingDetailsRequest
            {
                Participants = new List<ParticipantRequest>
                {
                    new()
                    {
                        ContactEmail = "contact1@hmcts.net",
                        HearingRoleCode = "APPL", DisplayName = "display name1",
                        FirstName = "fname", MiddleNames = "", LastName = "lname1", Username = "username1@hmcts.net",
                        OrganisationName = "", Representee = "", TelephoneNumber = ""
                    },
                    new()
                    {
                        ContactEmail = "contact2@hmcts.net",
                        HearingRoleCode = "APPL", DisplayName = "display name2",
                        FirstName = "fname2", MiddleNames = "", LastName = "lname2", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username2@hmcts.net"
                    },
                    new()
                    {
                        ContactEmail = "contact3@hmcts.net",
                        HearingRoleCode = "APPL", DisplayName = "display name3",
                        FirstName = "fname3", MiddleNames = "", LastName = "lname3", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username3@hmcts.net"
                    },
                    new()
                    {
                        ContactEmail = "contact4@hmcts.net",
                        HearingRoleCode = "PANL", DisplayName = "display name4",
                        FirstName = "fname4", MiddleNames = "", LastName = "lname4", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username4@hmcts.net"
                    },
                    new()
                    {
                        ContactEmail = "contact5@hmcts.net",
                        HearingRoleCode = "INTP", DisplayName = "display name2",
                        FirstName = "fname5", MiddleNames = "", LastName = "lname5", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username5@hmcts.net"
                    }
                },
                JudiciaryParticipants = new List<JudiciaryParticipantRequest>()
                {
                    new()
                    {
                        DisplayName = "display name4", PersonalCode = "12345678", Role = "PanelMember"
                    },
                    new()
                    {
                        DisplayName = "Judge Fudge", PersonalCode = "12345678", Role = "Judge"
                    }
                },
                Endpoints = new List<EndpointRequest>
                {
                    new()
                        {DisplayName = "displayname1", LinkedParticipantEmails = ["contact2@hmcts.net"]},
                    new()
                        {DisplayName = "displayname2", LinkedParticipantEmails = ["contact3@hmcts.net"]},
                },
                LinkedParticipants = new List<LinkedParticipantRequest>
                {
                    new()
                    {
                        ParticipantContactEmail = "contact1@hmcts.net",
                        LinkedParticipantContactEmail = "contact5@hmcts.net", Type = LinkedParticipantType.Interpreter
                    },
                    new()
                    {
                        ParticipantContactEmail = "contact5@hmcts.net",
                        LinkedParticipantContactEmail = "contact1@hmcts.net", Type = LinkedParticipantType.Interpreter
                    }
                },
                Cases = new List<CaseRequest>
                {
                    new()
                    {
                        Name = "Case1", Number = "001", IsLeadCase = true
                    }
                }
            };
            
            return bookNewHearingRequest;
        }
    }
}