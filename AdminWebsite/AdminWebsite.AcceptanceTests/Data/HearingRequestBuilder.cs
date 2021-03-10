using System;
using System.Collections.Generic;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestApi.Contract.Requests;

namespace AdminWebsite.AcceptanceTests.Data
{
    internal class HearingRequestBuilder
    {
        private readonly CreateHearingRequest _request;
        private const string DEFAULT_VENUE = "Birmingham Civil and Family Justice Centre";
        private const string CACD_CASE_TYPE_NAME = "Court of Appeal Criminal Division";

        public HearingRequestBuilder()
        {
            _request = new CreateHearingRequest()
            {
                Application = Application.AdminWeb,
                AudioRecordingRequired = false,
                QuestionnaireNotRequired = false,
                ScheduledDateTime = DateTime.UtcNow.AddHours(1),
                TestType = TestType.Automated,
                Users = new List<UserDto>(),
                Venue = DEFAULT_VENUE
            };
        }

        public HearingRequestBuilder WithUsers(List<UserDto> users)
        {
            _request.Users = users;
            return this;
        }

        public HearingRequestBuilder WithAudioRecordingRequired(bool audioRecording)
        {
            _request.AudioRecordingRequired = audioRecording;
            return this;
        }

        public CreateHearingRequest Build()
        {
            return _request;
        }

        public HearingRequestBuilder WithCACDCaseType()
        {
            _request.CaseType = CACD_CASE_TYPE_NAME;
            return this;
        }
    }
}
