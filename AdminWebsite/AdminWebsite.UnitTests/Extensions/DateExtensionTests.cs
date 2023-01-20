using System;
using AdminWebsite.Extensions;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Extensions;

public class DateExtensionTests
{
    
    [TestCase("2023, 01, 05", 1)]
    [TestCase("2022, 12, 30", 52)]
    public void Should_get_correct_week_of_the_year(DateTime testDate, int validWeek) 
        => testDate.GetWeekOfYear().Should().Be(validWeek);

    [TestCase("2023, 01, 13", 9 )] //9th of the month
    [TestCase("2023, 01, 20", 16 )] //9th of the month
    public void Should_get_first_day_of_week(DateTime testDate, int validDay)
        => testDate.FirstDayOfWeek().Day.Should().Be(validDay);
}