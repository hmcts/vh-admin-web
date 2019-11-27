﻿using System;
using System.Net;
using System.Runtime.Serialization;
using System.Threading;
using AdminWebsite.AcceptanceTests.Builders;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common;
using BookingConfirmation = AdminWebsite.AcceptanceTests.Pages.BookingConfirmation;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingConfirmationStep
    {
        private const int MaxRetries = 10;
        private readonly TestContext _context;
        private readonly BookingConfirmation _bookingConfirmation;

        public BookingConfirmationStep(TestContext context, BookingConfirmation bookingConfirmation)
        {
            _context = context;
            _bookingConfirmation = bookingConfirmation;
        }

        [Given(@"user is on booking confirmation page")]
        public void BookingsListPage()
        {
            _bookingConfirmation.PageUrl(PageUri.BookingConfirmationPage);
        }

        [When(@"hearing is booked")]
        [Then(@"hearing should be booked")]
        public void BookHearingConfirmation()
        {
            BookingsListPage();
            var expectedResult = $"{Data.BookingConfirmation.BookingConfirmationMessage} {_bookingConfirmation.GetItems("CaseNumber")} {_context.TestData.HearingData.CaseName} {_bookingConfirmation.GetItems("HearingDate")}";
            var hearingId = _bookingConfirmation.ExecuteScript("return sessionStorage.getItem('newHearingId')");
            _bookingConfirmation.AddItems("HearingId", hearingId);
            hearingId.Should().NotBeNullOrEmpty();

            PollForBookingsMessage(expectedResult);

            var endpoint = new BookingsApiUriFactory().HearingsEndpoints;
            _context.Request = _context.Get(endpoint.GetHearingDetailsById(Guid.Parse(hearingId)));

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.OK)
                .SendToBookingsApi();

            _context.Hearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(_context.Json);
            _context.Hearing.Should().NotBeNull();


            foreach (var participant in _context.TestData.ParticipantData)
            {
                var foundParticipant = _context.Hearing.Participants.Find(x => x.Display_name.Equals(participant.DisplayName));
                AssertParticipantData(participant, foundParticipant);
            }

            if (_context.Hearing.Id == null)
                throw new InvalidDataContractException("Hearing Id must be set");
            _context.HearingId = (Guid)_context.Hearing.Id;
        }

        private void PollForBookingsMessage(string expectedResult)
        {
            var found = false;

            for (var i = 0; i < MaxRetries; i++)
            {
                if (_bookingConfirmation.ConfirmationMessage().ToLower().Contains(expectedResult.ToLower()))
                {
                    found = true;
                    break;
                }

                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            found.Should().BeTrue();
        }

        private static void AssertParticipantData(ParticipantData expected, ParticipantResponse actual)
        {
            actual.City.Should().Be(expected.City);
            actual.County.Should().Be(expected.County);
            actual.House_number.Should().Be(expected.HouseNumber);
            actual.Street.Should().Be(expected.Street);
            actual.Display_name.Should().Be(expected.DisplayName);
            actual.First_name.Should().Be(expected.Firstname);
            actual.Hearing_role_name.Should().Be(expected.Role.ToString().Replace("LIP", " LIP"));
            actual.Last_name.Should().Be(expected.Lastname);
            actual.Organisation.Should().Be(expected.Organisation);
            actual.Postcode.Should().Be(expected.PostCode);
            actual.Representee.Should().Be(expected.ClientRepresenting);
            actual.Solicitor_reference.Should().Be(expected.SolicitorReference);
            actual.Title.Should().Be(expected.Title);
        }

        [When(@"admin user returns to the dashboard")]
        public void BookAnotherHearing()
        {
            _bookingConfirmation.BookAnotherHearing();
            _bookingConfirmation.PageUrl(PageUri.HearingDetailsPage);
        }
    }
}