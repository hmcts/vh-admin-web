using AdminWebsite.Helper;
using FluentAssertions;
using NUnit.Framework;
using System;


namespace AdminWebsite.UnitTests.Helper
{
    public class DateListMapperTest
    {
        [Test]
        public void Should_return_range_of_dates_not_included_weekends()
        {
            var startDate = new DateTime(2020, 10, 1, 4, 30, 0, 0);
            var endDate = new DateTime(2020, 10, 6, 4, 35, 0, 0);
            var expectDays = 3;

            var result = DateListMapper.GetListOfWorkingDates(startDate, endDate);

            result.Count.Should().Be(expectDays);
        }

        [Test]
        public void Should_return_empty_list_if_end_and_start_dates_is_the_same()
        {
            var startDate = new DateTime(2020, 10, 1);
            var endDate = new DateTime(2020, 10, 1);
            var expectDays = 0;

            var result = DateListMapper.GetListOfWorkingDates(startDate, endDate);

            result.Count.Should().Be(expectDays);
        }
    }
}
