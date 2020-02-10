using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Users;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class Apis
    {
        public BookingsApiManager BookingsApi { get; set; }
        public UserApiManager UserApi { get; set; }
        public VideoApiManager VideoApi { get; set; }
    }
}
