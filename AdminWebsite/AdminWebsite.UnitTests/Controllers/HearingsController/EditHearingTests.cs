using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Responses;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private EditHearingRequest _addNewParticipantRequest;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;

        private AdminWebsite.Controllers.HearingsController _controller;
        private EditHearingRequest _editEndpointOnHearingRequestWithJudge;
        private IHearingsService _hearingsService;

        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private HearingDetailsResponseV2 _updatedExistingParticipantHearingOriginal;
        private Mock<IUserIdentity> _userIdentity;
        private HearingDetailsResponseV2 _v2HearingDetailsResponse;

        private Guid _validId;
        private Mock<VodafoneConfiguration> _vodafoneConfigurationMock;
        private Mock<IOptions<VodafoneConfiguration>> _vodafoneOptionsMock;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();
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

            _vodafoneOptionsMock = new Mock<IOptions<VodafoneConfiguration>>();
            _vodafoneConfigurationMock = new Mock<VodafoneConfiguration>();
            _vodafoneOptionsMock.Setup((op) => op.Value).Returns(_vodafoneConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_bookingsApiClient.Object, _participantGroupLogger.Object);
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object);

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

            var cases = new List<CaseResponseV2>
            {
                new() {Name = "Case", Number = "123"}
            };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponseV2()
            {
                Id = _validId,
                GroupId = _validId,
                Participants = [
                    new ParticipantResponseV2()
                    {
                        Id = Guid.NewGuid(),
                        UserRoleName = "Individual",
                        ContactEmail = "old@domain.net",
                        Username = "old@domain.net"
                    }],
                Cases = cases,
                ServiceId = "ABC123",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };
            var participantId1 = Guid.NewGuid();
            var endpointGuid1 = Guid.NewGuid();
            var endpointGuid2 = Guid.NewGuid();
            var endpointGuid3 = Guid.NewGuid();
            var endpointGuid4 = Guid.NewGuid();
            var defenceAdvocate1 = "defenceAdvocate1";
            var defenceAdvocate2 = "defenceAdvocate2";
            var defenceAdvocate3 = "defenceAdvocate3";
            var defenceAdvocate4 = "defenceAdvocate4";

            _editEndpointOnHearingRequestWithJudge = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "Case",
                    Number = "123"
                },
                Participants = new List<EditParticipantRequest>()
                {
                    new() {
                        Id = participantId1,
                        HearingRoleName = HearingRoleName.Expert,
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

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);

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
                JudicialOfficeHolders = new List<JudiciaryParticipantResponse>()
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
        public async Task Should_return_updated_hearing2()
        {
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
            var existingJudiciaryParticipants = updatedHearing.JudicialOfficeHolders.ToList();
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
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsV2Async(It.IsAny<Guid>(),
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
                    It.Is<List<BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest>>(r => 
                            r.Any(y => y.PersonalCode == panelMemberToAdd.PersonalCode))),
                Times.Once);
        }

        [Test]
        public async Task Should_return_updated_hearingV2()
        {
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            
            var existingJudge = updatedHearing.JudicialOfficeHolders
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
            
            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsV2Async(
                    It.IsAny<Guid>(), 
                    It.IsAny<UpdateHearingParticipantsRequestV2>()),
                Times.Never);
        }

        [Test]
        public async Task Should_return_updated_hearingV2_with_no_judiciary_participants_provided()
        {
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            updatedHearing.JudicialOfficeHolders.Clear();
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
            
            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsV2Async(
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

            var existingPanelMembers = updatedHearing.JudicialOfficeHolders
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
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            updatedHearing.JudicialOfficeHolders.Clear();
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
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Add(new ()
            {
                Id = Guid.NewGuid(),
                UserRoleName = "Judge",
                ContactEmail = "judge@contact.email",
                Username = "judge@username.net",
                HearingRoleCode = "Judge"
                
            });
            updatedHearing.JudicialOfficeHolders.Clear();
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
            var updatedHearing = _v2HearingDetailsResponse;
            updatedHearing.Participants.Clear();
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            var existingJudge = updatedHearing.JudicialOfficeHolders
                .Find(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge);
            var existingPanelMembers = updatedHearing.JudicialOfficeHolders
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
                    It.IsAny<List<BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest>>()),
                Times.Never);
        }

        [Test]
        public async Task Should_update_endpoint_to_be_linked_to_new_defence_advocate_when_endpoint_is_not_currently_linked()
        {
            // ie there is an endpoint currently not linked to a defence advocate
            // as part of the request we add a new participant and link them to this endpoint as a defence advocate
            
            Guid hearingId;
            var request = _editEndpointOnHearingRequestWithJudge;
            var endpointInRequestToUpdate = request.Endpoints[0];
            
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
                x => x.UpdateEndpointV2Async(hearingId, It.IsAny<Guid>(),
                    It.Is<UpdateEndpointRequestV2>(r =>
                        r.DefenceAdvocateContactEmail == newParticipantDefenceAdvocate.ContactEmail)), 
                Times.Exactly(expectedUpdatedEndpointCount));
        }
    }
}