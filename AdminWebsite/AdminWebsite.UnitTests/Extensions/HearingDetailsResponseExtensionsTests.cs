using AdminWebsite.Extensions;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoApi.Contract.Enums;

namespace AdminWebsite.UnitTests.Extensions
{
    public class HearingDetailsResponseExtensionsTests
    {
        private HearingDetailsResponse _hearing;

        [SetUp]
        public void Setup()
        {
            _hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>()
            };
        }

        [Test]
        public void Should_Return_True_If_Judge_Phone_Exists()
        {
            var otherInfo = new OtherInformationDetails { JudgePhone = "1234564978" };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();

            _hearing.DoesJudgePhoneExist().Should().BeTrue();
        }

        [Test]
        public void Should_Return_False_If_Judge_Phone_Does_Not_Exist()
        {
            _hearing.DoesJudgePhoneExist().Should().BeFalse();
        }

        [Test]
        public void Should_Return_True_If_Judge_Email_Exists()
        {
            var otherInfo = new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();

            _hearing.DoesJudgeEmailExist().Should().BeTrue();
        }

        [Test]
        public void Should_Return_False_If_Judge_Email_Does_Not_Exist()
        {
            _hearing.DoesJudgeEmailExist().Should().BeFalse();
        }

        [Test]
        public void Should_Return_False_If_Judge_Email_is_empty()
        {
            var otherInfo = new OtherInformationDetails { JudgeEmail = "" };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();
            _hearing.DoesJudgeEmailExist().Should().BeFalse();
        }

        [Test]
        public void Should_Return_False_If_Judge_Email_is_null()
        {
            var otherInfo = new OtherInformationDetails { JudgeEmail = null };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();
            _hearing.DoesJudgeEmailExist().Should().BeFalse();
        }

        [Test]
        public void Should_Return_False_If_OtherInformation_Is_Null_When_Comparing_Judge_Emails()
        {
            _hearing.HasJudgeEmailChanged(new HearingDetailsResponse { Id = Guid.NewGuid(), Participants = new List<ParticipantResponse>() }).Should().BeFalse();
        }

        [Test]
        public void Should_Return_False_If_Judge_Has_Not_Changed_When_Comparing_Judge_Emails()
        {
            var otherInfo = new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();

            var hearing2 = new HearingDetailsResponse { Id = Guid.NewGuid(), Participants = new List<ParticipantResponse>() };
            var hearing2OtherInfo = new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" };
            hearing2.OtherInformation = hearing2OtherInfo.ToOtherInformationString();

            _hearing.HasJudgeEmailChanged(hearing2).Should().BeFalse();
        }

        [Test]
        public void Should_Return_True_If_Judge_Has_Changed_When_Comparing_Judge_Emails()
        {
            var otherInfo = new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();

            var hearing2 = new HearingDetailsResponse { Id = Guid.NewGuid(), Participants = new List<ParticipantResponse>() };
            var hearing2OtherInfo = new OtherInformationDetails { JudgeEmail = "judge2@hmcts.net" };
            hearing2.OtherInformation = hearing2OtherInfo.ToOtherInformationString();

            _hearing.HasJudgeEmailChanged(hearing2).Should().BeTrue();
        }

        [Test]
        public void Should_return_true_when_ejud_email_has_been_assigned_from_no_judge()
        {
            var judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.UserRoleName = UserRole.Judge.ToString())
                .With(x => x.Username = "new@judiciaryejud.com")
                .Build();
            var newHearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse> { judge }
            };
            _hearing.HasJudgeEmailChanged(newHearing).Should().BeTrue();
        }

        [Test]
        public void Should_return_true_when_ejud_email_has_changed_to_another_ejud()
        {
            var existingEJudJudge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.UserRoleName = UserRole.Judge.ToString())
                .With(x => x.Username = "old@judiciaryejud.com")
                .Build();
            _hearing.Participants.Add(existingEJudJudge);

            var newEJudJudge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.UserRoleName = UserRole.Judge.ToString())
                .With(x => x.ContactEmail = "new@judiciaryejud.com")
                .Build();
            var newHearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse> { newEJudJudge }
            };
            _hearing.HasJudgeEmailChanged(newHearing).Should().BeTrue();
        }

        [Test]
        public void Should_return_true_when_ejud_email_has_changed_to_vh_judge()
        {
            var otherInfo = new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" };
            _hearing.OtherInformation = otherInfo.ToOtherInformationString();

            var newEJudJudge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.UserRoleName = UserRole.Judge.ToString())
                .With(x => x.ContactEmail = "new@judiciaryejud.com")
                .Build();
            var newHearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse> { newEJudJudge }
            };
            _hearing.HasJudgeEmailChanged(newHearing).Should().BeTrue();
        }

        [Test]
        public void Should_return_true_when_vh_judge_has_changed_to_ejud_judge()
        {
            var existingEJudJudge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.UserRoleName = UserRole.Judge.ToString())
                .With(x => x.ContactEmail = "old@judiciaryejud.com")
                .Build();
            _hearing.Participants.Add(existingEJudJudge);


            var otherInfo = new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" };
            var newHearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>(),
                OtherInformation = otherInfo.ToOtherInformationString()
            };
            _hearing.HasJudgeEmailChanged(newHearing).Should().BeTrue();
        }
    }
}