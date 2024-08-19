using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using AdminWebsite.Configuration;
using AdminWebsite.Extensions;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Responses;
using BookingStatus = BookingsApi.Contract.V1.Enums.BookingStatus;
using CaseResponse = BookingsApi.Contract.V1.Responses.CaseResponse;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;
using LinkedParticipantResponse = BookingsApi.Contract.V1.Responses.LinkedParticipantResponse;
using LinkedParticipantType = BookingsApi.Contract.V1.Enums.LinkedParticipantType;
using ParticipantResponse = BookingsApi.Contract.V1.Responses.ParticipantResponse;
using RoleNames = AdminWebsite.Contracts.Enums.RoleNames;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private EditHearingRequest _addEndpointToHearingRequest;
        private EditHearingRequest _editEndpointOnHearingRequestWithJudge;
        private EditHearingRequest _removeEndpointOnHearingRequest;
        private EditHearingRequest _addNewParticipantRequest;
        private Mock<IBookingsApiClient> _bookingsApiClient;

        private AdminWebsite.Controllers.HearingsController _controller;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private HearingDetailsResponse _existingHearingWithEndpointsOriginal;
        private HearingDetailsResponse _existingHearingWithLinkedParticipants;
        private HearingDetailsResponse _existingHearingWithJudge;
        private IHearingsService _hearingsService;

        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private HearingDetailsResponse _updatedExistingParticipantHearingOriginal;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;
        private Mock<IOptions<KinlyConfiguration>> _kinlyOptionsMock;
        private Mock<KinlyConfiguration> _kinlyConfigurationMock;

        private Guid _validId;
        private Mock<IFeatureToggles> _featureToggle;
        private HearingDetailsResponseV2 _v2HearingDetailsResponse;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();
            _featureToggle = new Mock<IFeatureToggles>();
            _featureToggle.Setup(e => e.BookAndConfirmToggle()).Returns(true);
            _conferencesServiceMock.Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = "expected_conference_phone_id"
                    }
                });

            _kinlyOptionsMock = new Mock<IOptions<KinlyConfiguration>>();
            _kinlyConfigurationMock = new Mock<KinlyConfiguration>();
            _kinlyOptionsMock.Setup((op) => op.Value).Returns(_kinlyConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_bookingsApiClient.Object, _participantGroupLogger.Object, _featureToggle.Object);
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object,
                 _featureToggle.Object);

            _validId = Guid.NewGuid();
            _addNewParticipantRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "Case",
                    Number = "123"
                },
                Participants = new List<EditParticipantRequest>
                {
                    new EditParticipantRequest
                    {
                        ContactEmail = "new@domain.net.",
                        FirstName = "Test_FirstName",
                        LastName = "Test_LastName"
                    }
                },
            };

            var cases = new List<CaseResponse>
            {
                new CaseResponse {Name = "Case", Number = "123"}
            };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Participants = [
                    new ParticipantResponse
                    {
                        Id = Guid.NewGuid(),
                        UserRoleName = "Individual",
                        ContactEmail = "old@domain.net",
                        Username = "old@domain.net"
                    }],
                Cases = cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };
            var participantId1 = Guid.NewGuid();
            var participantId2 = Guid.NewGuid();
            var participantId3 = Guid.NewGuid();
            var participantId4 = Guid.NewGuid();
            var endpointGuid1 = Guid.NewGuid();
            var endpointGuid2 = Guid.NewGuid();
            var endpointGuid3 = Guid.NewGuid();
            var endpointGuid4 = Guid.NewGuid();
            var defenceAdvocate1 = "defenceAdvocate1";
            var defenceAdvocate2 = "defenceAdvocate2";
            var defenceAdvocate3 = "defenceAdvocate3";
            var defenceAdvocate4 = "defenceAdvocate4";
            _existingHearingWithLinkedParticipants = new HearingDetailsResponse()
            {
                Id = _validId,
                GroupId = _validId,
                Cases = cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = participantId1, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = new List<LinkedParticipantResponse>()
                    },
                    new ParticipantResponse
                    {
                        Id = participantId2, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = participantId3}
                        }
                    },
                    new ParticipantResponse
                    {
                        Id = participantId3, CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = participantId2}
                        }
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };
            _addEndpointToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>(),
                Endpoints = new List<EditEndpointRequest>
                {
                    new EditEndpointRequest { Id = null, DisplayName = "New Endpoint", DefenceAdvocateContactEmail = "username@domain.net" },
                    new EditEndpointRequest { Id = endpointGuid1, DisplayName = "data1", DefenceAdvocateContactEmail = defenceAdvocate1 },
                    new EditEndpointRequest { Id = endpointGuid2, DisplayName = "data2", DefenceAdvocateContactEmail = defenceAdvocate2 },
                    new EditEndpointRequest { Id = endpointGuid3, DisplayName = "data3", DefenceAdvocateContactEmail = defenceAdvocate3 },
                    new EditEndpointRequest { Id = endpointGuid4, DisplayName = "data4", DefenceAdvocateContactEmail = defenceAdvocate4 }
                }
            };

            _editEndpointOnHearingRequestWithJudge = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "Case",
                    Number = "123"
                },
                Participants = new List<EditParticipantRequest>()
                {
                    new EditParticipantRequest() {
                        Id = participantId1,
                        CaseRoleName = "judge",
                        HearingRoleName = HearingRoleName.Judge,
                        FirstName = "FirstName",
                        LastName = "LastName",
                        ContactEmail = "judge@email.com",
                        DisplayName = "FirstName LastName",
                        LinkedParticipants = new List<LinkedParticipant>(),
                        OrganisationName = "Org1",
                        Representee = "Rep1",
                        TelephoneNumber = "+44 123 1234",
                        Title = "Mr",
                        MiddleNames = "MiddleNames"
                    }
                },
                Endpoints = new List<EditEndpointRequest>
                {
                    new EditEndpointRequest { Id = endpointGuid1, DisplayName = "data1", DefenceAdvocateContactEmail = defenceAdvocate1 },
                    new EditEndpointRequest { Id = endpointGuid2, DisplayName = "data2", DefenceAdvocateContactEmail = defenceAdvocate2 },
                    new EditEndpointRequest { Id = endpointGuid3, DisplayName = "data3", DefenceAdvocateContactEmail = defenceAdvocate3 },
                    new EditEndpointRequest { Id = endpointGuid4, DisplayName = "data4-edit", DefenceAdvocateContactEmail = defenceAdvocate4 }
                }
            };

            _removeEndpointOnHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "Case",
                    Number = "123"
                },
                Endpoints = new List<EditEndpointRequest>
                {
                    new EditEndpointRequest { Id = endpointGuid1, DisplayName = "data1", DefenceAdvocateContactEmail = defenceAdvocate1 },
                    new EditEndpointRequest { Id = endpointGuid2, DisplayName = "data2", DefenceAdvocateContactEmail = defenceAdvocate2 },
                    new EditEndpointRequest { Id = endpointGuid3, DisplayName = "data3", DefenceAdvocateContactEmail = defenceAdvocate3 }
                }
            };

            _existingHearingWithEndpointsOriginal = new HearingDetailsResponse
            {
                Id = _validId,
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse { Id = participantId1, ContactEmail = defenceAdvocate1 },
                    new ParticipantResponse { Id = participantId2, ContactEmail = defenceAdvocate2 },
                    new ParticipantResponse { Id = participantId3, ContactEmail = defenceAdvocate3 },
                    new ParticipantResponse { Id = participantId4, ContactEmail = defenceAdvocate4 }
                },
                Endpoints = new List<EndpointResponse>
                {
                    new EndpointResponse { Id = endpointGuid1, DisplayName = "data1", Pin = "0000", Sip = "1111111111", DefenceAdvocateId = participantId1 },
                    new EndpointResponse { Id = endpointGuid2, DisplayName = "data2", Pin = "1111", Sip = "2222222222", DefenceAdvocateId = participantId2 },
                    new EndpointResponse { Id = endpointGuid3, DisplayName = "data3", Pin = "2222", Sip = "5544332234", DefenceAdvocateId = participantId3 },
                    new EndpointResponse { Id = endpointGuid4, DisplayName = "data4", Pin = "2222", Sip = "5544332234", DefenceAdvocateId = participantId4 }
                },
                Cases = cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3)
            };

            _existingHearingWithJudge = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = Guid.NewGuid(), CaseRoleName = "judge", HearingRoleName = HearingRoleName.Judge,
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = new List<LinkedParticipantResponse>()
                    },
                    new ParticipantResponse { Id = participantId1, ContactEmail = defenceAdvocate1 },
                    new ParticipantResponse { Id = participantId2, ContactEmail = defenceAdvocate2 },
                    new ParticipantResponse { Id = participantId3, ContactEmail = defenceAdvocate3 },
                    new ParticipantResponse { Id = participantId4, ContactEmail = defenceAdvocate4 }
                },
                Cases = cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3)
            };
      
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);

            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult());

            _v2HearingDetailsResponse = new HearingDetailsResponseV2
            {
                Id = _validId,
                ScheduledDateTime = DateTime.UtcNow,
                ServiceId = "ServiceId",
                Participants = new List<ParticipantResponseV2>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        UserRoleName = "Individual",
                        ContactEmail = "old@domain.net"
                    }
                },
                Cases = new List<CaseResponseV2>
                {
                    new()
                    {
                        Name = "caseName",
                        Number = "caseNumber",
                        IsLeadCase = true,
                    }
                },
                HearingRoomName = "hearingRoomName",
                OtherInformation = "otherInformation",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "createdBy",
                UpdatedBy = "updatedBy",
                UpdatedDate = DateTime.UtcNow,
                ConfirmedBy = "confirmedBy",
                ConfirmedDate = DateTime.UtcNow,
                Status = BookingStatusV2.Booked,
                AudioRecordingRequired = true,
                CancelReason = null,
                Endpoints = new List<EndpointResponseV2>()
                {
                    new()
                    {
                        DefenceAdvocateId = Guid.NewGuid(),
                        DisplayName = "displayName",
                        Id = Guid.NewGuid(),
                        Pin = "pin",
                        Sip = "sip"
                    }
                },
                JudiciaryParticipants = new List<JudiciaryParticipantResponse>()
                {
                    new (){FullName = "Judge Fudge", FirstName = "John", LastName = "Doe", HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge, PersonalCode = "1234"},
                    new (){FullName = "Jane Doe", FirstName = "Jane", LastName = "Doe", HearingRoleCode = JudiciaryParticipantHearingRoleCode.PanelMember, PersonalCode = "4567"},
                    new (){FullName = "John Doe", FirstName = "John", LastName = "Doe", HearingRoleCode = JudiciaryParticipantHearingRoleCode.PanelMember, PersonalCode = "5678"}
                }
            };
        }

        [Test]
        public async Task Should_return_bad_request_if_invalid_hearing_id()
        {
            var invalidId = Guid.Empty;
            var key = "hearingId";
            var errorMessage = "Please provide a valid hearingId";
            var result = await _controller.EditHearing(invalidId, _addNewParticipantRequest);
            
            result.Result.Should().NotBeNull();
            var objectResult = (ObjectResult)result.Result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            validationProblems.Should().NotBeNull();
            validationProblems!.Errors.ContainsKey(key).Should().BeTrue();
            validationProblems.Errors[key][0].Should().Be(errorMessage);
        }

        [Test]
        public async Task Should_return_bad_request_if_case_is_not_given()
        {
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult(new[]
                {
                    new ValidationFailure("case", "Please provide valid case details", new object())
                }));

            _addNewParticipantRequest.Case = null;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var objectResult = (ObjectResult)result.Result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors["case"].Should().BeEquivalentTo("Please provide valid case details");
        }

        [Test]
        public async Task Should_return_bad_request_if_no_participants_are_given()
        {
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult(new[]
                {
                    new ValidationFailure("participants", "Please provide at least one participant", new object())
                }));

            _addNewParticipantRequest.Participants.Clear();
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var objectResult = (ObjectResult)result.Result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors["participants"].Should().Contain( "Please provide at least one participant");
        }
        
        [Test]
        public async Task Should_return_not_found_if_hearing_is_missing()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var notFoundResult = (NotFoundObjectResult)result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }

        [Test]
        public void Should_throw_if_hearing_exception_is_not_of_type_not_found()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<BookingsApiException>(async () => await _controller.EditHearing(_validId, _addNewParticipantRequest));
        }

        [Test]
        public async Task Should_return_bad_request_if_editing_hearing_fails_with_bad_request_status_code()
        {
            //Arrange
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithLinkedParticipants);
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"Hearing", ["Cannot remove a participant from hearing that is close to start time"] },
            });
            
            _bookingsApiClient.Setup(x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingParticipantsRequest>()))
                .Throws(ClientException.ForBookingsAPIValidation(validationProblemDetails));

            //Act
            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            //Assert
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_throw_if_editing_hearing_fails_with_non_bad_request()
        {

            if (true)
            {
                //execute
            }

            if (false)
            {
                //execute
            }

            //Arrange
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithLinkedParticipants);
            _bookingsApiClient.Setup(x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingParticipantsRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            //Act/Assert
            
            var response = _controller.EditHearing(_validId, _addNewParticipantRequest);

            ((ObjectResult)response.Result.Result).StatusCode.Should().Be(500);
        }

        [TestCase("Confirmed By")]
        [TestCase("")]
        public async Task Should_add_panel_members_for_a_hearing(string confirmedBy)
        {
            //Arrange
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test",
                ConfirmedBy = confirmedBy
            };

            _addNewParticipantRequest.Participants = new List<EditParticipantRequest> {new EditParticipantRequest
            {
                HearingRoleName = RoleNames.PanelMember,
                ContactEmail = "new.contactactemail@domain.net",
                DisplayName = "new.displayName@domain.net",
                CaseRoleName = RoleNames.PanelMember
            } };

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            //Act
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            //Assert
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()));
        }

        [Test]
        public async Task Should_return_updated_hearing()
        {
            var updatedHearing = new HearingDetailsResponse
            {
                Id = _validId,
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test"
            };
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "new@domain.net",
                Username = "new@domain.net",
                UserRoleName = "Individual"
            });

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var hearing = (AdminWebsite.Contracts.Responses.HearingDetailsResponse)((OkObjectResult)result.Result).Value;
            hearing.Id.Should().Be(_updatedExistingParticipantHearingOriginal.Id);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        u.Cases.Count > 0)),
                Times.Once);
        }
        
        [Test]
        public async Task Should_return_updated_hearingV2()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            var existingParticipant = updatedHearing.Participants.First(x => x.ContactEmail == "old@domain.net");
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                Id = Guid.NewGuid(),
                ContactEmail = "interpreter@domain.net",
                HearingRoleCode = "INTP",
                LinkedParticipants = new List<LinkedParticipant>
                {
                    new()
                    {
                        ParticipantContactEmail = "interpreter@domain.net",
                        LinkedParticipantContactEmail = existingParticipant.ContactEmail,
                        Type = AdminWebsite.Contracts.Enums.LinkedParticipantType.Interpreter
                    }
                }
            });
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                Id = existingParticipant.Id,
                ContactEmail = existingParticipant.ContactEmail,
                HearingRoleCode = "APPL",
                LinkedParticipants = new List<LinkedParticipant>
                {
                    new()
                    {
                        ParticipantContactEmail = existingParticipant.ContactEmail,
                        LinkedParticipantContactEmail = "interpreter@domain.net",
                        Type = AdminWebsite.Contracts.Enums.LinkedParticipantType.Interpreter
                    }
                },
            });
            var existingJudiciaryParticipants = updatedHearing.JudiciaryParticipants.ToList();
            _addNewParticipantRequest.JudiciaryParticipants = existingJudiciaryParticipants.Select(x => new JudiciaryParticipantRequest
            {
                PersonalCode = x.PersonalCode,
                DisplayName = x.DisplayName,
                Role = x.HearingRoleCode.ToString()
            }).ToList();
            
            var panelMemberToRemove = _addNewParticipantRequest.JudiciaryParticipants.Find(x => x.PersonalCode == "4567");
            _addNewParticipantRequest.JudiciaryParticipants.Remove(panelMemberToRemove);
            var panelMemberToAdd = new JudiciaryParticipantRequest
            {
                DisplayName = "NewPanelMemberDisplayName",
                PersonalCode = "NewPanelMemberPersonalCode",
                Role = "PanelMember"
            };
            _addNewParticipantRequest.JudiciaryParticipants.Add(panelMemberToAdd);

            var panelMemberToUpdate = _addNewParticipantRequest.JudiciaryParticipants.Find(x => x.PersonalCode == "5678");
            panelMemberToUpdate.DisplayName = "NewPanelMemberDisplayName";

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var hearing = (AdminWebsite.Contracts.Responses.HearingDetailsResponse)((OkObjectResult)result.Result).Value;
            hearing.Id.Should().Be(updatedHearing.Id);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetails2Async(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequestV2>(u =>
                        u.Cases.Count > 0)),
                Times.Once);

            _bookingsApiClient.Verify(x => x.RemoveJudiciaryParticipantFromHearingAsync(
                    hearing.Id, 
                    panelMemberToRemove.PersonalCode),
                Times.Once);
            
            _bookingsApiClient.Verify(x => x.UpdateJudiciaryParticipantAsync(
                    hearing.Id, 
                    panelMemberToUpdate.PersonalCode, 
                    It.IsAny<UpdateJudiciaryParticipantRequest>()),
                Times.Once);
            
            _bookingsApiClient.Verify(x => x.AddJudiciaryParticipantsToHearingAsync(
                    hearing.Id, 
                    It.Is<List<BookingsApi.Contract.V1.Requests.JudiciaryParticipantRequest>>(r => 
                            r.Any(y => y.PersonalCode == panelMemberToAdd.PersonalCode))),
                Times.Once);
        }
        
        [Test]
        public async Task Should_return_updated_hearingV2_with_no_participants_provided()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            
            var existingJudge = updatedHearing.JudiciaryParticipants
                .Find(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge);
            
            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                },
                JudiciaryParticipants = new List<JudiciaryParticipantRequest>
                {
                    new()
                    {
                        DisplayName = existingJudge.DisplayName,
                        PersonalCode = existingJudge.PersonalCode,
                        Role = existingJudge.HearingRoleCode.ToString()
                    }
                }
            };
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            _bookingsApiClient.Verify(x => x.UpdateHearingParticipants2Async(
                    It.IsAny<Guid>(), 
                    It.IsAny<UpdateHearingParticipantsRequestV2>()),
                Times.Never);
        }
        
        [Test]
        public async Task Should_return_updated_hearingV2_with_no_judiciary_participants_provided()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            updatedHearing.JudiciaryParticipants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            
            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                }
            };
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            _bookingsApiClient.Verify(x => x.UpdateHearingParticipants2Async(
                    It.IsAny<Guid>(), 
                    It.IsAny<UpdateHearingParticipantsRequestV2>()),
                Times.Never);
            _bookingsApiClient.Verify(x => x.ReassignJudiciaryJudgeAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<ReassignJudiciaryJudgeRequest>()),
                Times.Never);
        }

        [Test]
        public async Task Should_return_updated_hearingV2_with_new_judge_different_to_old_judge()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            
            var newJudge = new JudiciaryParticipantRequest
            {
                DisplayName = "NewJudgeDisplayName",
                PersonalCode = "NewJudgePersonalCode",
                Role = JudiciaryParticipantHearingRoleCode.Judge.ToString()
            };

            var existingPanelMembers = updatedHearing.JudiciaryParticipants
                .Where(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.PanelMember);
            
            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                },
                JudiciaryParticipants = new List<JudiciaryParticipantRequest>
                {
                    newJudge
                }
            };
            request.JudiciaryParticipants.AddRange(existingPanelMembers.Select(x => new JudiciaryParticipantRequest
            {
                DisplayName = x.DisplayName,
                PersonalCode = x.PersonalCode,
                Role = x.HearingRoleCode.ToString()
            }));
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            AssertJudiciaryJudgeReassigned(updatedHearing, newJudge);
        }

        [Test]
        public async Task Should_return_updated_hearingV2_with_new_judge_and_no_old_judge()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            updatedHearing.JudiciaryParticipants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            
            var newJudge = new JudiciaryParticipantRequest
            {
                DisplayName = "NewJudgeDisplayName",
                PersonalCode = "NewJudgePersonalCode",
                Role = JudiciaryParticipantHearingRoleCode.Judge.ToString()
            };

            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                },
                JudiciaryParticipants = new List<JudiciaryParticipantRequest>
                {
                    newJudge
                }
            };
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            AssertJudiciaryJudgeReassigned(updatedHearing, newJudge);
        }
        
        [Test]
        public async Task Should_return_updated_hearingV2_with_old_judge_and_no_new_judge()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                }
            };
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            _bookingsApiClient.Verify(x => x.ReassignJudiciaryJudgeAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<ReassignJudiciaryJudgeRequest>()),
                Times.Never);
        }

                
        [Test]
        public async Task Should_reassign_a_generic_judge_booked_with_v1_to_ejud_judge_on_v2()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Add(new ()
            {
                Id = Guid.NewGuid(),
                UserRoleName = "Judge",
                ContactEmail = "judge@contact.email",
                Username = "judge@username.net",
                HearingRoleCode = "Judge"
                
            });
            updatedHearing.JudiciaryParticipants.Clear();
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                              .ReturnsAsync(updatedHearing);

            var request = new EditHearingRequest
            {
                JudiciaryParticipants = new List<JudiciaryParticipantRequest>
                {
                    new()
                    {
                        DisplayName = "Judge Fudge",
                        PersonalCode = "1234",
                        Role = JudiciaryParticipantHearingRoleCode.Judge.ToString(),
                    }
                },
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                }
            };
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            _bookingsApiClient.Verify(x => x.ReassignJudiciaryJudgeAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<ReassignJudiciaryJudgeRequest>()),
                Times.Once);
        }

        [Test]
        public async Task Should_return_updated_hearingV2_with_participants_unchanged_and_hearing_close_to_start_time()
        {
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            var existingJudge = updatedHearing.JudiciaryParticipants
                .Find(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge);
            var existingPanelMembers = updatedHearing.JudiciaryParticipants
                .Where(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.PanelMember);
            
            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = updatedHearing.Cases[0].Name, 
                    Number = updatedHearing.Cases[0].Number
                },
                JudiciaryParticipants = new List<JudiciaryParticipantRequest>
                {
                    new()
                    {
                        DisplayName = existingJudge.DisplayName,
                        PersonalCode = existingJudge.PersonalCode,
                        Role = existingJudge.HearingRoleCode.ToString()
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddMinutes(15)
            };
            request.JudiciaryParticipants.AddRange(existingPanelMembers.Select(x => new JudiciaryParticipantRequest
            {
                DisplayName = x.DisplayName,
                PersonalCode = x.PersonalCode,
                Role = x.HearingRoleCode.ToString()
            }));
            
            var result = await _controller.EditHearing(_validId, request);
            
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            // Updating judiciary participants (other than reassigning the hearing's judge) when the hearing is close to start time is rejected by bookings api
            // so we shouldn't send the request if it's not needed
            _bookingsApiClient.Verify(x => x.UpdateJudiciaryParticipantAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<UpdateJudiciaryParticipantRequest>()),
                Times.Never);
        }

        private void AssertJudiciaryJudgeReassigned(
            HearingDetailsResponseV2 hearing,
            JudiciaryParticipantRequest newJudge)
        {
            // Removing judges is not supported - they should be reassigned instead
            
            _bookingsApiClient.Verify(x => x.ReassignJudiciaryJudgeAsync(
                    hearing.Id,
                    It.Is<ReassignJudiciaryJudgeRequest>(x => 
                        x.DisplayName == newJudge.DisplayName && 
                        x.PersonalCode == newJudge.PersonalCode)),
                Times.Once);
            
            _bookingsApiClient.Verify(x => x.RemoveJudiciaryParticipantFromHearingAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<string>()),
                Times.Never);
            
            _bookingsApiClient.Verify(x => x.AddJudiciaryParticipantsToHearingAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<List<BookingsApi.Contract.V1.Requests.JudiciaryParticipantRequest>>()),
                Times.Never);
        }
      
        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"Hearing", ["Cannot remove a participant from hearing that is close to start time"] },
            });

            _bookingsApiClient.Setup(x =>
                    x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPIValidation(validationProblemDetails));

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task Should_pass_on_not_found_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task Should_replace_judge_based_on_email()
        {
            var existingJudgeId = Guid.NewGuid();
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                FirstName = "Existing",
                LastName = "Judge",
                ContactEmail = "existing@domain.net",
                Username = "existing@domain.net",
                CaseRoleName = "Judge",
                UserRoleName = "Judge",
                HearingRoleName = "Judge",
                Id = existingJudgeId
            });

            const string newJudgeEmail = "new@domain.net";
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                CaseRoleName = "Judge",
                HearingRoleName = "Judge",
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail
            });

            var newPats = _updatedExistingParticipantHearingOriginal.Participants.Where(x => x.Id != existingJudgeId)
                .ToList();
            newPats.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "new@domain.net",
                Username = "new@domain.net",
                UserRoleName = "Individual"
            });
            newPats.Add(new ParticipantResponse
            {
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail,
                Username = newJudgeEmail,
                UserRoleName = "Judge",
                CaseRoleName = "Judge",
                HearingRoleName = "Judge",
            });
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = newPats,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test"
            };

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsAsync(_validId,
                It.Is<UpdateHearingParticipantsRequest>(
                    participants => participants.NewParticipants.Any(p => p.Username == newJudgeEmail))), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        u.Cases.Count > 0)),
                Times.Once);
        }

        [Test]
        public async Task Should_add_endpoint_if_new_endpoint_is_added_to_endpoint_list()
        {
            _addEndpointToHearingRequest.Participants = new List<EditParticipantRequest>();
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(
                x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        u.Cases.Count > 0)),
                Times.Once);
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Never);
            _bookingsApiClient.Verify(
                x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }

        [Test]
        public async Task Should_update_endpoint_if_an_endpoint_is_updates_in_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _editEndpointOnHearingRequestWithJudge);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        u.Cases.Count > 0)), Times.Once);
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()),
                Times.Never);

        }
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task Should_update_endpoint_to_be_linked_to_new_defence_advocate_when_endpoint_is_not_currently_linked(bool useV2)
        {
            // ie there is an endpoint currently not linked to a defence advocate
            // as part of the request we add a new participant and link them to this endpoint as a defence advocate
            
            // Arrange
            _featureToggle.Setup(x => x.UseV2Api()).Returns(useV2);

            Guid hearingId;
            var request = _editEndpointOnHearingRequestWithJudge;
            var endpointInRequestToUpdate = request.Endpoints[0];
            
            if (useV2)
            {
                var hearing = _v2HearingDetailsResponse;
                hearingId = hearing.Id;
                var existingEndpointToUpdate = new EndpointResponseV2
                {
                    Id = endpointInRequestToUpdate.Id.Value,
                    DisplayName = "Endpoint A",
                    DefenceAdvocateId = null
                };
                hearing.Endpoints.RemoveAll(e => e.Id != existingEndpointToUpdate.Id);
                hearing.Endpoints.Add(existingEndpointToUpdate);

                _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                    .ReturnsAsync(hearing);
            }
            else
            {
                var hearing = _existingHearingWithEndpointsOriginal;
                hearingId = hearing.Id;
                var existingEndpointToUpdate = hearing.Endpoints[0];
                existingEndpointToUpdate.DefenceAdvocateId = null;
                hearing.Endpoints.RemoveAll(e => e.Id != existingEndpointToUpdate.Id);

                _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                    .ReturnsAsync(hearing);
            }
      
            var newParticipantDefenceAdvocate = new EditParticipantRequest
            {
                ContactEmail = "legalrep@email.com",
                DisplayName = "Legal Rep",
                FirstName = "Legal",
                HearingRoleCode = "LGRP",
                HearingRoleName = "Legal Representative",
                Id = null,
                LastName = "Rep"
            };
            
            request.Participants.Add(newParticipantDefenceAdvocate);
            
            request.Endpoints.RemoveAll(e => e.Id != endpointInRequestToUpdate.Id);
            endpointInRequestToUpdate.DefenceAdvocateContactEmail = newParticipantDefenceAdvocate.ContactEmail;
            
            // Act
            var result = await _controller.EditHearing(_validId, _editEndpointOnHearingRequestWithJudge);
            
            // Assert
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            var expectedUpdatedEndpointCount = request.Endpoints.Count;
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(hearingId, It.IsAny<Guid>(),
                    It.Is<UpdateEndpointRequest>(r =>
                        r.DefenceAdvocateContactEmail == newParticipantDefenceAdvocate.ContactEmail)), 
                Times.Exactly(expectedUpdatedEndpointCount));
        }

        [Test]
        public async Task Should_remove_endpoint_if_endpoint_is_removed_from_the_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _removeEndpointOnHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(
                x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Never);

            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()),
                Times.Once);

            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        u.Cases.Count > 0)), Times.Once);

            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Never);
        }

        [Test]
        public async Task If_Judge_Added_To_Hearing_And_Saved_Should_Auto_confirm_booking()
        {
            // arrange - original hearing
            var hearingId = _updatedExistingParticipantHearingOriginal.Id;
            var originalHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            var updatedHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            updatedHearing.Participants.Add(new ParticipantResponse{
                DisplayName = "newJudge",
                HearingRoleName = RoleNames.Judge,
                CaseRoleName = RoleNames.Judge,
                UserRoleName = RoleNames.Judge,
                ContactEmail = "judge@moj.gov.uk"
            });
            originalHearing.Status = BookingStatus.Booked;
            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(originalHearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> {originalHearing});
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ReturnsAsync(originalHearing)
                .ReturnsAsync(updatedHearing);
            // arrange - request
            var request = new EditHearingRequest();
            request.Case = new EditCaseRequest();
            request.Participants.Add(new EditParticipantRequest
            {
                DisplayName = "newJudge",
                HearingRoleName = RoleNames.Judge,
                CaseRoleName = RoleNames.Judge,
                ContactEmail = "judge@moj.gov.uk"
            });
            //Act
            var result = await _controller.EditHearing(hearingId, request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

        }
        
        [Test]
        public async Task Should_not_update_DisplayName_if_no_matching_endpoint_exists_in_list()
        {
            _existingHearingWithEndpointsOriginal.Endpoints[0].Id = Guid.NewGuid();
            _existingHearingWithEndpointsOriginal.Endpoints[0].DisplayName = "data1-edit";
            _existingHearingWithEndpointsOriginal.Endpoints[0].DefenceAdvocateId = null;
            _existingHearingWithEndpointsOriginal.Endpoints[3].DisplayName = "data4-edit";
            _existingHearingWithEndpointsOriginal.Endpoints[3].DefenceAdvocateId = null;

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);

            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(
                x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Once);

            // The old Endpoints[0] has no matching Id now, and so it will be removed
            _bookingsApiClient.Verify(
                x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Once);

            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        u.Cases.Count > 0)), Times.Once);

            // Endpoints[3] has had their details changed, and so will be updated
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_process_participants()
        {
            //Arrange
            var existingLinkedParticipantOne =
                _existingHearingWithLinkedParticipants.Participants.Find(x => x.LinkedParticipants.Count > 0);
            var existingLinkedParticipantTwo =
                _existingHearingWithLinkedParticipants.Participants
                .SingleOrDefault(x => x.Id == existingLinkedParticipantOne.LinkedParticipants[0].LinkedId);

            var editPrefix = "Edited";
            var updatedExistingLinkedParticipantOne = new EditParticipantRequest
            {
                Id = existingLinkedParticipantOne.Id,
                ContactEmail = existingLinkedParticipantOne.ContactEmail,
                FirstName = editPrefix + existingLinkedParticipantOne.FirstName,
                LastName = editPrefix + existingLinkedParticipantOne.LastName,
                LinkedParticipants = new List<LinkedParticipant>
                    {
                        new LinkedParticipant
                        {
                            LinkedId = existingLinkedParticipantTwo.Id,
                            LinkedParticipantContactEmail = existingLinkedParticipantTwo.ContactEmail,
                            ParticipantContactEmail = existingLinkedParticipantOne.ContactEmail
                        }
                    }
            };

            var updatedExistingLinkedParticipantTwo = new EditParticipantRequest
            {
                Id = existingLinkedParticipantTwo.Id,
                ContactEmail = existingLinkedParticipantTwo.ContactEmail,
                FirstName = editPrefix + existingLinkedParticipantTwo.FirstName,
                LastName = editPrefix + existingLinkedParticipantTwo.LastName,
                LinkedParticipants = new List<LinkedParticipant>
                    {
                        new LinkedParticipant
                        {
                            LinkedId = existingLinkedParticipantOne.Id,
                            LinkedParticipantContactEmail = existingLinkedParticipantTwo.ContactEmail,
                            ParticipantContactEmail = existingLinkedParticipantTwo.ContactEmail
                        }
                    }
            };

            var newParticipant = new EditParticipantRequest
            {
                ContactEmail = "ContactEmail",
                FirstName = "Hi",
                LastName = "Hello",
            };

            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>
            {
                updatedExistingLinkedParticipantOne,
                updatedExistingLinkedParticipantTwo,
                newParticipant
            };

            var removedParticipantIds = _existingHearingWithLinkedParticipants.Participants
                .Where(p => _addNewParticipantRequest.Participants.TrueForAll(rp => rp.Id != p.Id)).Select(x => x.Id).ToList();

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithLinkedParticipants);

            //Act
            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<OkObjectResult>();

            Func<List<Guid>, List<Guid>, bool> areRemovedParticipantIdsCorrect = (List<Guid> listOne, List<Guid> listTwo) =>
            {
                foreach (var guid in listOne)
                {
                    if (!listTwo.Contains(guid))
                        return false;
                }

                return true;
            };

            //Assert
            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsAsync(_validId,
                It.Is<UpdateHearingParticipantsRequest>(participants =>
                    participants.NewParticipants.Count == 1
                    && participants.NewParticipants[0].ContactEmail == newParticipant.ContactEmail
                    && participants.NewParticipants[0].FirstName == newParticipant.FirstName
                    && participants.NewParticipants[0].LastName == newParticipant.LastName

                    && participants.RemovedParticipantIds.Count == removedParticipantIds.Count
                    && areRemovedParticipantIdsCorrect(participants.RemovedParticipantIds, removedParticipantIds)

                    && participants.ExistingParticipants.Count == 2

                    && participants.LinkedParticipants.Count == 1
                    && participants.LinkedParticipants[0].ParticipantContactEmail == existingLinkedParticipantOne.ContactEmail
                    && participants.LinkedParticipants[0].LinkedParticipantContactEmail == existingLinkedParticipantTwo.ContactEmail
             )), Times.Once);
        }

        [Test]
        public async Task Should_add_a_new_participant_and_link_to_existing_interpreter_when_editing_a_hearing()
        {
            var newUserContactEmail = "newindividual4.user@email.com";
            var interpreter =
                _existingHearingWithLinkedParticipants.Participants.First(p =>
                    p.HearingRoleName.Equals("interpreter",StringComparison.CurrentCultureIgnoreCase));

            var partipant4 = Guid.NewGuid();

            var _existingHearingWithNewLinkedParticipants = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Cases = _existingHearingWithLinkedParticipants.Cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1", LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = interpreter.Id, CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = partipant4}
                        }
                    },
                    new ParticipantResponse
                    {
                        Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual4.user@email.com", UserRoleName = "Individual4",
                        FirstName = "testuser4", LinkedParticipants = null
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = "|JudgeEmail|judge@email.com|JudgePhone|0123454678"
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithNewLinkedParticipants);


            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                     new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", FirstName = "Judge", TelephoneNumber = "003"
                    },
                      new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com",
                        FirstName = "testuser1", TelephoneNumber = "001"
                    },
                       new EditParticipantRequest
                    {
                       Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual4.user@email.com",
                        FirstName = "testuser4", TelephoneNumber = "000"
                    },
                    new EditParticipantRequest
                    {
                        CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "newindividual4.user@email.com", DisplayName = "NewIndividual4", FirstName = "NewIndividual4",
                        LastName = "newIndividual4", TelephoneNumber = "000",
                    },
                    new EditParticipantRequest
                    {
                        Id = interpreter.Id,
                        CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", DisplayName = "newUser", FirstName = "firstName",
                        LastName = "lastName", TelephoneNumber = "000",
                        LinkedParticipants = new List<LinkedParticipant>
                        {
                            new LinkedParticipant
                            {
                                ParticipantContactEmail = "interpreter.user@email.com",
                                LinkedParticipantContactEmail = newUserContactEmail,
                                Type = AdminWebsite.Contracts.Enums.LinkedParticipantType.Interpreter
                            }
                        }
                    }
                },
                OtherInformation = "|JudgeEmail|judge@email.com|JudgePhone|0123454678"
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(
                x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.Is<UpdateHearingParticipantsRequest>(x => x.LinkedParticipants.Any(x => x.LinkedParticipantContactEmail == newUserContactEmail))), Times.Once);

            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u => u.Cases.Count > 0)), Times.Once);
        }
        
        [Test]
        public async Task Should_create_a_new_judge_and_set_username_to_contact_email()
        {
            var _existingHearing = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Cases = _existingHearingWithLinkedParticipants.Cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>(),
                ScheduledDateTime = DateTime.UtcNow.AddHours(3)
            };

            _bookingsApiClient.Setup(x 
                => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearing);
            
            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                     new EditParticipantRequest
                    {
                        CaseRoleName = "Judge", 
                        HearingRoleName = "Judge",
                        ContactEmail = "judge@email.com",
                        FirstName = "Judge", 
                        TelephoneNumber = "0123454678"
                    }
                },
                OtherInformation = "|JudgeEmail|notify_judge@email.com|JudgePhone|9876"
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            _bookingsApiClient.Verify(x 
                => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(uhpr => HearingRequestValidation(uhpr))));
            
            _bookingsApiClient.Verify(x 
                => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingParticipantsRequest>(uhpr => JudgeRequestValidation(uhpr))));
        }
        
        private static bool HearingRequestValidation(UpdateHearingRequest request)
        {
            request.OtherInformation.Should().Be("|JudgeEmail|notify_judge@email.com|JudgePhone|9876");
            return true;
        }
        
        private static bool JudgeRequestValidation(UpdateHearingParticipantsRequest request)
        {
            request.NewParticipants[0].Username.Should().Be("judge@email.com");
            request.NewParticipants[0].ContactEmail.Should().Be("judge@email.com");
            request.NewParticipants[0].TelephoneNumber.Should().Be("0123454678");
            return true;
        }

        [Test]
        public async Task Returns_Valid_When_Linked_Contact_Email_Is_Null_When_Adding_A_New_Participant_To_Existing_Hearing()
        {
            var linkedParticipantEmail = "individual4.user@email.com";
            var interpreter =
                _existingHearingWithLinkedParticipants.Participants.First(p =>
                    p.HearingRoleName.Equals("interpreter", StringComparison.CurrentCultureIgnoreCase));

            var partipant4 = Guid.NewGuid();

            var _existingHearingWithNewLinkedParticipants = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Cases = _existingHearingWithLinkedParticipants.Cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1", LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = interpreter.Id, CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = partipant4}
                        }
                    },
                    new ParticipantResponse
                    {
                        Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = linkedParticipantEmail, UserRoleName = "Individual4",
                        FirstName = "testuser4", LinkedParticipants = null
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithNewLinkedParticipants);


            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                     new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", FirstName = "Judge", TelephoneNumber = "003"
                    },
                      new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com",
                        FirstName = "testuser1", TelephoneNumber = "001"
                    },
                       new EditParticipantRequest
                    {
                       Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual4.user@email.com",
                        FirstName = "testuser4", TelephoneNumber = "000"
                    },
                    new EditParticipantRequest
                    {
                        CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "newindividual4.user@email.com", DisplayName = "NewIndividual4", FirstName = "NewIndividual4",
                        LastName = "newIndividual4", TelephoneNumber = "000",
                    },
                    new EditParticipantRequest
                    {
                        Id = interpreter.Id,
                        CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", DisplayName = "newUser", FirstName = "firstName",
                        LastName = "lastName", TelephoneNumber = "000",
                        LinkedParticipants = new List<LinkedParticipant>
                        {
                            new LinkedParticipant
                            {
                                LinkedId = partipant4,
                                Type = AdminWebsite.Contracts.Enums.LinkedParticipantType.Interpreter,
                                LinkedParticipantContactEmail = null
                            }
                        }
                    }
                },
                OtherInformation = ""
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(
                x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.Is<UpdateHearingParticipantsRequest>(x => x.LinkedParticipants.Any(x => x.LinkedParticipantContactEmail == linkedParticipantEmail))), Times.Once);

            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u => u.Cases.Count > 0)), Times.Once);
        }

        [TestCase(BookingStatus.Booked, 0)]
        [TestCase(BookingStatus.Created, 1)]
        public async Task
            Should_correctly_decide_when_to_send_judge_hearing_confirm_email_on_edit_when_email_has_been_updated(
                BookingStatus status, int timeSent)
        {
            // arrange
            var hearingId = _updatedExistingParticipantHearingOriginal.Id;
            var newJudgeEmailOtherInfo = new OtherInformationDetails { JudgeEmail = "judgene@domain.net" };
            var updatedHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                UserRoleName = "Judge"
            });
            updatedHearing.CaseTypeName = "Unit Test";
            updatedHearing.Cases[0].Name = "Case";
            updatedHearing.Cases[0].Number = "123";
            updatedHearing.OtherInformation = newJudgeEmailOtherInfo.ToOtherInformationString();
            updatedHearing.Status = status;

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(updatedHearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { updatedHearing });
            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                OtherInformation = updatedHearing.OtherInformation
            };

            // act
            var result = await _controller.EditHearing(hearingId, request);

            // assert
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_handle_failed_booking_request_on_retry()
        {
            _existingHearingWithJudge.ScheduledDateTime = DateTime.UtcNow.AddMinutes(10);
            _existingHearingWithJudge.Status = BookingStatus.Failed;
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithJudge)
                .ReturnsAsync(_existingHearingWithJudge);
            
            var request = FailedHearingRequest();

            var result = await _controller.EditHearing(_validId, request);  

            var response = ((ObjectResult)result.Result)?.Value as AdminWebsite.Contracts.Responses.HearingDetailsResponse;

            response.Status.Should().Be((AdminWebsite.Contracts.Enums.BookingStatus)BookingStatus.Failed);

            ((ObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsAsync(
                    It.IsAny<Guid>(), 
                    It.IsAny<UpdateHearingParticipantsRequest>()),
                Times.Once);
        }

        private EditHearingRequest FailedHearingRequest()
        {
            return  new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "Case",
                    Number = "123"
                },
                Participants = new List<EditParticipantRequest>
                {
                    new EditParticipantRequest
                    {
                        ContactEmail = "test@domain.net.",
                        FirstName = "FirstName",
                        LastName = "LastName",
                        HearingRoleName = HearingRoleName.Judge
                    }
                }
            };
        }

    }
}