using AdminWebsite.Models;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Client;
using UserApi.Client;
using UserApi.Contract.Requests;
using UserApi.Contract.Responses;
using Autofac.Extras.Moq;
using VideoApi.Contract.Responses;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V2.Requests;
using LinkedParticipantType = AdminWebsite.Contracts.Enums.LinkedParticipantType;
using V1 = BookingsApi.Contract.V1.Requests;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class BookNewHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        private string _expectedUserIdentityName;

        [SetUp]
        public void Setup()
        {
            _expectedUserIdentityName = "created by";

            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
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
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }

        private BookingDetailsRequest InitHearingForTest()
        {
            // request with existing person, new user, existing user in AD but not in persons table 
            var bookNewHearingRequest = new BookingDetailsRequest
            {
                Participants = new List<AdminWebsite.Contracts.Requests.ParticipantRequest>
                {
                    new ()
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact1@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name1",
                        FirstName = "fname", MiddleNames = "", LastName = "lname1", Username = "username1@hmcts.net",
                        OrganisationName = "", Representee = "", TelephoneNumber = ""
                    },
                    new ()
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact2@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name2",
                        FirstName = "fname2", MiddleNames = "", LastName = "lname2", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username2@hmcts.net"
                    },
                    new ()
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact3@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name3",
                        FirstName = "fname3", MiddleNames = "", LastName = "lname3", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username3@hmcts.net"
                    },
                    new ()
                    {
                        CaseRoleName = "Panel Member", ContactEmail = "contact4@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name4",
                        FirstName = "fname4", MiddleNames = "", LastName = "lname4", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username4@hmcts.net"
                    },
                    new ()
                    {
                        CaseRoleName = "Judge", ContactEmail = "judge@hmcts.net",
                        HearingRoleName = "Judge", DisplayName = "Judge Fudge",
                        FirstName = "Jack", MiddleNames = "", LastName = "Fudge",
                        Username = "judge.fudge@hmcts.net", OrganisationName = "", Representee = "",
                        TelephoneNumber = ""
                    }
                },
                Endpoints = new List<EndpointRequest>
                {
                    new ()
                        {DisplayName = "displayname1", DefenceAdvocateContactEmail = "username1@hmcts.net"},
                    new ()
                        {DisplayName = "displayname2", DefenceAdvocateContactEmail = "fname2.lname2@hmcts.net"},
                }
            };

            return SetUpRequest(bookNewHearingRequest);
        }

        private BookingDetailsRequest InitHearingForV2Test()
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
                        {DisplayName = "displayname1", DefenceAdvocateContactEmail = "username1@hmcts.net"},
                    new()
                        {DisplayName = "displayname2", DefenceAdvocateContactEmail = "fname2.lname2@hmcts.net"},
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
            
            return SetUpRequest(bookNewHearingRequest);
        }

        private BookingDetailsRequest SetUpRequest(BookingDetailsRequest bookNewHearingRequest)
        {
            _mocker.Mock<IUserAccountService>().Setup(x => x.GetAdUserIdForUsername(It.IsAny<string>())).ReturnsAsync(Guid.NewGuid().ToString());

            foreach (var participant in bookNewHearingRequest.Participants.Where(x =>
                !string.IsNullOrWhiteSpace(x.Username)))
            {
                var profile = new UserProfile
                {
                    UserId = Guid.NewGuid().ToString(),
                    UserName = participant.Username,
                    FirstName = participant.FirstName,
                    LastName = participant.LastName
                };
                _mocker.Mock<IUserApiClient>().Setup(x => x.GetUserByAdUserIdAsync(It.Is<string>(e => e == participant.Username)))
                    .ReturnsAsync(profile);
            }

            foreach (var participant in bookNewHearingRequest.Participants.Where(x =>
                string.IsNullOrWhiteSpace(x.Username)))
            {
                var newUser = new NewUserResponse()
                {
                    UserId = Guid.NewGuid().ToString(),
                    Username = $"{participant.FirstName}.{participant.LastName}@hmcts.net",
                    OneTimePassword = "randomTest123"
                };
                _mocker.Mock<IUserApiClient>()
                    .Setup(x => x.CreateUserAsync(It.Is<CreateUserRequest>(userRequest =>
                        userRequest.RecoveryEmail == participant.ContactEmail))).ReturnsAsync(newUser);
            }

            var existingPat3 = bookNewHearingRequest.Participants.Single(x => x.ContactEmail == "contact3@hmcts.net");

            var existingUser3 = new UserProfile()
            {
                UserId = Guid.NewGuid().ToString(),
                UserName = $"{existingPat3.FirstName}.{existingPat3.LastName}@hmcts.net",
                Email = existingPat3.ContactEmail,
                FirstName = existingPat3.FirstName,
                LastName = existingPat3.LastName,
                DisplayName = existingPat3.DisplayName,
            };
            
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetUserByEmailAsync(existingPat3.ContactEmail)).ReturnsAsync(existingUser3);

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<Exception, Task>
                (
                    It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                    It.IsAny<Func<Task, bool>>(), It.IsAny<Func<Task<Task>>>()
                ))
                .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                    Func<Task, bool> handleResultCondition, Func<Task> executeFunction) =>
                {
                    sleepDuration(1);
                    retryAction(1);
                    handleResultCondition(Task.CompletedTask);
                    await executeFunction();
                })
                .ReturnsAsync(Task.CompletedTask);

            return bookNewHearingRequest;
        }
    }
}