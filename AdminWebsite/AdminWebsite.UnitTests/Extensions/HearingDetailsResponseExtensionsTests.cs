using System;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Models;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;

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
                Id = Guid.NewGuid()
            };
        }
        
        [Test]
        public void Should_Return_True_If_Judge_Phone_Exists()
        {
            _hearing.Other_information =
                JsonConvert.SerializeObject(new OtherInformationDetails {JudgePhone = "123456789"});

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
            _hearing.Other_information =
                JsonConvert.SerializeObject(new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"});

            _hearing.DoesJudgeEmailExist().Should().BeTrue();
        }
        
        [Test]
        public void Should_Return_False_If_Judge_Email_Does_Not_Exist()
        {
            _hearing.DoesJudgeEmailExist().Should().BeFalse();
        }
    }
}