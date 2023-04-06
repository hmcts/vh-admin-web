using System;

namespace AdminWebsite.Helper;

public class Calculator
{
    public Double Add(double x, double y)
    {
        return x + y;
    }

    public Double Subtract(double x, double y)
    {
        return x - y;
    }

    public Double Multiply(double x, double y)
    {
        return x * y;
    }

    public Double Divide(double x, double y)
    {
        if (y != 0)
        {
            return x / y;
        }
        else
        {
            return 0;
        }

    }
}