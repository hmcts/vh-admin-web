using System.Text;

namespace AdminWebsite.Helper
{
    /// <summary>
    ///     Holds all of the settings for the password generator
    /// </summary>
    public class PasswordGeneratorSettings
    {
        private const string LowercaseCharacters = "abcdefghijklmnopqrstuvwxyz";
        private const string UppercaseCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string NumericCharacters = "0123456789";
        private const string SpecialCharacters = @"!#$%&*@\";
        private readonly int _defaultMaxPasswordLength = 128;
        private readonly int _defaultMinPasswordLength = 8;

        public PasswordGeneratorSettings(bool includeLowercase, bool includeUppercase, bool includeNumeric,
            bool includeSpecial, int passwordLength, int maximumAttempts, bool usingDefaults)
        {
            IncludeLowercase = includeLowercase;
            IncludeUppercase = includeUppercase;
            IncludeNumeric = includeNumeric;
            IncludeSpecial = includeSpecial;
            PasswordLength = passwordLength;
            MaximumAttempts = maximumAttempts;
            MinimumLength = _defaultMinPasswordLength;
            MaximumLength = _defaultMaxPasswordLength;
            UsingDefaults = usingDefaults;
            CharacterSet = BuildCharacterSet(includeLowercase, includeUppercase, includeNumeric, includeSpecial);
        }

        public bool IncludeLowercase { get; set; }
        public bool IncludeUppercase { get; set; }
        public bool IncludeNumeric { get; set; }
        public bool IncludeSpecial { get; set; }
        public int PasswordLength { get; set; }
        public string CharacterSet { get; set; }
        public int MaximumAttempts { get; set; }
        public int MinimumLength { get; set; }
        public int MaximumLength { get; set; }
        public bool UsingDefaults { get; set; }

        private string BuildCharacterSet(bool includeLowercase, bool includeUppercase, bool includeNumeric,
            bool includeSpecial)
        {
            var characterSet = new StringBuilder();
            if (includeLowercase) characterSet.Append(LowercaseCharacters);

            if (includeUppercase) characterSet.Append(UppercaseCharacters);

            if (includeNumeric) characterSet.Append(NumericCharacters);

            if (includeSpecial) characterSet.Append(SpecialCharacters);
            return characterSet.ToString();
        }

        public PasswordGeneratorSettings AddLowercase()
        {
            StopUsingDefaults();
            IncludeLowercase = true;
            CharacterSet += LowercaseCharacters;
            return this;
        }

        public PasswordGeneratorSettings AddUppercase()
        {
            StopUsingDefaults();
            IncludeUppercase = true;
            CharacterSet += UppercaseCharacters;
            return this;
        }

        public PasswordGeneratorSettings AddNumeric()
        {
            StopUsingDefaults();
            IncludeNumeric = true;
            CharacterSet += NumericCharacters;
            return this;
        }

        public PasswordGeneratorSettings AddSpecial()
        {
            StopUsingDefaults();
            IncludeSpecial = true;
            CharacterSet += SpecialCharacters;
            return this;
        }

        private void StopUsingDefaults()
        {
            if (UsingDefaults)
            {
                CharacterSet = string.Empty;
                IncludeLowercase = false;
                IncludeUppercase = false;
                IncludeNumeric = false;
                IncludeSpecial = false;
                UsingDefaults = false;
            }
        }
    }
}
