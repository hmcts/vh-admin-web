namespace AdminWebsite.Validators
{
    public class ValidationFailure
    {
        public ValidationFailure(string name, string message)
        {
            Name = name;
            Message = message;
        }
        public string Name { get; }
        public string Message { get; }
    }
}