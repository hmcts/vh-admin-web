using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions;

namespace AdminWebsite.UnitTests.Extensions
{
    public class HearingDetailsResponseExtensionsTests
    {
        [Test]
        public void HasScheduleAmended__True_WhenDatesHaveChanged()
        {
            var hearing = new HearingDetailsResponse
            {
                ScheduledDateTime = DateTime.UtcNow
            };
            var anotherHearing = new HearingDetailsResponse
            {
                ScheduledDateTime = DateTime.UtcNow.AddHours(1)
            };
            
            var result = hearing.HasScheduleAmended(anotherHearing);
            
            result.Should().BeTrue();
        }
        
        [Test]
        public void HasScheduleAmended__False_WhenDatesAreTheSame()
        {
            var now = DateTime.UtcNow;
            var hearing = new HearingDetailsResponse
            {
                ScheduledDateTime = now
            };
            var anotherHearing = new HearingDetailsResponse
            {
                ScheduledDateTime = now
            };
            
            var result = hearing.HasScheduleAmended(anotherHearing);
            
            result.Should().BeFalse();
        }
    }
}