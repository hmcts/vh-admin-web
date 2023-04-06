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

    [Test]
    public void should_multiply()
    {
        var sut = new Calculator();
        
        var result = sut.Multiply(2, 2);
        
        Assert.AreEqual(4, result);
    }
    
    [Test]
    public void should_divide()
    {
        var sut = new Calculator();
        
        var result = sut.Divide(4, 2);
        
        Assert.AreEqual(2, result);
    }
}