using System;
using FluentAssertions;
using NUnit.Framework;
using AdminWebsite.Mappers;
using AdminWebsite.Services.Models;

namespace AdminWebsite.UnitTests.Mappers
{
    public class PublicHolidaysResponseMapperTest
    {
        [Test]
        public void should_map_public_holiday_to_response()
        {
            var date = DateTime.Today.AddDays(3);
            var title = "Summer Bank Holiday";
            var pb = new PublicHoliday
            {
                Date = date,
                Title = title
            };

            var result = PublicHolidayResponseMapper.MapFrom(pb);
            
            result.Date.Should().Be(date);
            result.Name.Should().Be(title);
        }
    }
}