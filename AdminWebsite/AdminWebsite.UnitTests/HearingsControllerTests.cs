using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests
{
    public class HearingsControllerTests
    {
        private Mock<IHearingApiClient> _hearingServicesMock;
        private Mock<IUserAccountService> _userAccountServiceMock;
        private Mock<UserManager> _userManagerMock;
        private HearingsController _controller;
        private Mock<IUserIdentity> _userIdentity;
        
        [SetUp]
        public void SetUp()
        {
            var claims = new List<Claim>
            { 
                new Claim(ClaimTypes.Name, "username"),
                new Claim(ClaimTypes.NameIdentifier, "userId"),
                new Claim("name", "John Doe")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            
            _hearingServicesMock = new Mock<IHearingApiClient>();
            _userAccountServiceMock = new Mock<IUserAccountService>();
            _userManagerMock = new Mock<UserManager>(_userAccountServiceMock.Object);
            _userIdentity = new Mock<IUserIdentity>();
            
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _hearingServicesMock.Setup(x => x.CreateHearingAsync(It.IsAny<HearingRequest>())).ReturnsAsync(1);

            _controller = new HearingsController(_hearingServicesMock.Object, _userManagerMock.Object,_userIdentity.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public void should_not_check_ad_for_judge_or_administrator()
        {
            var request = CreateBaseHearingRequest();
            request = AddJudgeAndAdminToRequest(request);
            _controller.Post(request);
            _userManagerMock.Verify(x => x.GetUsernameForUserWithRecoveryEmail("judge@personal.com"),
                Times.Never);
            
            _userManagerMock.Verify(x => x.GetUsernameForUserWithRecoveryEmail("admin@personal.com"),
                Times.Never);
        }
        
        [Test]
        public void should_create_account_for_participant_when_username_does_not_exist()
        {
            var request = CreateBaseHearingRequest();
            request = AddParticipantsToRequest(request);

            var participant = request.Feeds[0].Participants[0];
            var username = "chris.green@hearings.reform.hmcts.net";

            
            _userManagerMock.Setup(x => x.GetUsernameForUserWithRecoveryEmail(participant.Email))
                .Returns((string) null);

            _userManagerMock.Setup(x =>
                    x.CreateAdAccount(participant.First_name, participant.Last_name, participant.Email,
                        participant.Role))
                .Returns(username);
            
            _controller.Post(request);

            _userManagerMock.Verify(x => x.CreateAdAccount(participant.First_name,
                participant.Last_name, participant.Email, participant.Role), Times.Once);
        }

        [Test]
        public void should_not_create_account_for_participant_when_username_does_exist()
        {
            var request = CreateBaseHearingRequest();
            request = AddParticipantsToRequest(request);

            var participant = request.Feeds[0].Participants[0];
            var existingUsername = "chris.green@hearings.reform.hmcts.net";
            
            _userManagerMock.Setup(x => x.GetUsernameForUserWithRecoveryEmail(participant.Email))
                .Returns(existingUsername);

            _controller.Post(request);
            
            _userManagerMock.Verify(x => x.CreateAdAccount(participant.First_name,
                participant.Last_name, participant.Email, participant.Role), Times.Never);

            _userManagerMock.Verify(x => x.AddToGroupsByUsername(participant.Username, participant.Role), Times.Once);
        }
        
        private HearingRequest AddJudgeAndAdminToRequest(HearingRequest request)
        {
            request.Feeds = new List<FeedRequest>
            {
                new FeedRequest
                {
                    Location = "Judge Room",
                    Participants = new List<ParticipantRequest>
                    {
                        new ParticipantRequest
                        {
                            Title = "Mr",
                            First_name = "Judge",
                            Last_name = "Kinly",
                            Username = "Judge.Kinly@hearings.reform.hmcts.net",
                            Email = "judge@personal.com",
                            Display_name = "Judge Kinly",
                            Role = "Judge"
                        }
                    }
                },
                new FeedRequest
                {
                    Location = "Admin Room",
                    Participants = new List<ParticipantRequest>
                    {
                        new ParticipantRequest
                        {
                            Title = "Mr",
                            First_name = "Admin",
                            Last_name = "Kinly",
                            Username = "Admin.Kinly@hearings.reform.hmcts.net",
                            Email = "admin@personal.com",
                            Display_name = "Admin",
                            Role = "Administrator"
                        }
                    }
                }
            };
            return request;
        }
        
        private HearingRequest AddParticipantsToRequest(HearingRequest request)
        {
            request.Feeds = new List<FeedRequest>
            {
                new FeedRequest
                    {
                        Location = "Participants Room",
                        Participants = new List<ParticipantRequest>
                        {
                            new ParticipantRequest
                            {
                                Title = "Mr",
                                First_name = "John",
                                Last_name = "Doe",
                                Username = null,
                                Email = "john@doe.com",
                                Display_name = "John Doe",
                                Role = "Citizen"
                            }
                        }
                    }
            };
            return request;
        }
        private HearingRequest CreateBaseHearingRequest()
        {
            return new HearingRequest
            {
                Scheduled_date_time = DateTime.Today.AddDays(1).AddHours(10).AddMinutes(30),
                Scheduled_duration = 30,
                Hearing_type_id = 1,
                Hearing_medium_id = 1,
                Court_id = 1,
                Cases =
                    new List<CaseRequest>
                    {
                        new CaseRequest
                        {
                            Name = "Captain America Vs Iron Man", Number = new Random().Next().ToString()
                        }
                    }
            };
        }
    }
}
