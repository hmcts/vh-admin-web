using System;
using System.Collections.Generic;
using AdminWebsite.TestAPI.Client;

namespace AdminWebsite.AcceptanceTests.Data
{
    internal class HearingRequestBuilder
    {
        private readonly CreateHearingRequest _request;
        private const string DEFAULT_VENUE = "Birmingham Civil and Family Justice Centre";

        public HearingRequestBuilder()
        {
            _request = new CreateHearingRequest()
            {
                Application = Application.AdminWeb,
                Audio_recording_required = false,
                Questionnaire_not_required = false,
                Scheduled_date_time = DateTime.UtcNow.AddHours(1),
                Test_type = TestType.Automated,
                Users = new List<User>(),
                Venue = DEFAULT_VENUE
            };
        }

        public HearingRequestBuilder WithUsers(List<User> users)
        {
            _request.Users = users;
            return this;
        }

        public CreateHearingRequest Build()
        {
            return _request;
        }
    }
}
