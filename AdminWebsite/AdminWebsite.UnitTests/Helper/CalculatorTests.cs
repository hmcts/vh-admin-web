using AdminWebsite.Helper;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Helper;

public class CalculatorTests
{
    [Test]
    public void add_two_numbers()
    {
        var sut = new Calculator();

        var result = sut.Add(1, 2);

        Assert.AreEqual(3, result);
    }

    [Test]
    public void should_subtract()
    {
        var sut = new Calculator();

        var result = sut.Subtract(2, 1);

        Assert.AreEqual(1, result);
    }
}