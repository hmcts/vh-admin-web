using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace AdminWebsite.Helper
{
    /// <summary>
    ///     Generates random passwords and validates that they meet the rules passed in
    ///     Ported from https://github.com/prjseal/PasswordGenerator since there is not a compatible package for this project
    /// </summary>
    public class PasswordGenerator
    {
        private readonly bool _defaultIncludeLowercase = true;
        private readonly bool _defaultIncludeNumeric = true;
        private readonly bool _defaultIncludeSpecial = true;
        private readonly bool _defaultIncludeUppercase = true;
        private readonly int _defaultMaxPasswordAttempts = 10000;
        private readonly int _defaultPasswordLength = 16;

        public PasswordGenerator()
        {
            Settings = new PasswordGeneratorSettings(_defaultIncludeLowercase, _defaultIncludeUppercase,
                _defaultIncludeNumeric, _defaultIncludeSpecial, _defaultPasswordLength, _defaultMaxPasswordAttempts,
                true);
        }

        public PasswordGenerator(PasswordGeneratorSettings settings)
        {
            Settings = settings;
        }

        public PasswordGenerator(int passwordLength)
        {
            Settings = new PasswordGeneratorSettings(_defaultIncludeLowercase, _defaultIncludeUppercase,
                _defaultIncludeNumeric, _defaultIncludeSpecial, passwordLength, _defaultMaxPasswordAttempts, true);
        }

        public PasswordGenerator(bool includeLowercase, bool includeUppercase, bool includeNumeric, bool includeSpecial)
        {
            Settings = new PasswordGeneratorSettings(includeLowercase, includeUppercase, includeNumeric, includeSpecial,
                _defaultPasswordLength, _defaultMaxPasswordAttempts, false);
        }

        public PasswordGenerator(bool includeLowercase, bool includeUppercase, bool includeNumeric, bool includeSpecial,
            int passwordLength)
        {
            Settings = new PasswordGeneratorSettings(includeLowercase, includeUppercase, includeNumeric, includeSpecial,
                passwordLength, _defaultMaxPasswordAttempts, false);
        }

        public PasswordGenerator(bool includeLowercase, bool includeUppercase, bool includeNumeric, bool includeSpecial,
            int passwordLength, int maximumAttempts)
        {
            Settings = new PasswordGeneratorSettings(includeLowercase, includeUppercase, includeNumeric, includeSpecial,
                passwordLength, maximumAttempts, false);
        }

        private PasswordGeneratorSettings Settings { get; set; }

        public PasswordGenerator IncludeLowercase()
        {
            Settings = Settings.AddLowercase();
            return this;
        }

        public PasswordGenerator IncludeUppercase()
        {
            Settings = Settings.AddUppercase();
            return this;
        }

        public PasswordGenerator IncludeNumeric()
        {
            Settings = Settings.AddNumeric();
            return this;
        }

        public PasswordGenerator IncludeSpecial()
        {
            Settings = Settings.AddSpecial();
            return this;
        }

        public PasswordGenerator LengthRequired(int passwordLength)
        {
            Settings.PasswordLength = passwordLength;
            return this;
        }

        /// <summary>
        ///     Gets the next random password which meets the requirements
        /// </summary>
        /// <returns>A password as a string</returns>
        public string Next()
        {
            string password;
            if (!LengthIsValid(Settings.PasswordLength, Settings.MinimumLength, Settings.MaximumLength))
            {
                password = string.Format("Password length invalid. Must be between {0} and {1} characters long",
                    Settings.MinimumLength, Settings.MaximumLength);
            }
            else
            {
                var passwordAttempts = 0;
                do
                {
                    password = GenerateRandomPassword(Settings);
                    passwordAttempts++;
                } while (passwordAttempts < Settings.MaximumAttempts && !PasswordIsValid(Settings, password));

                password = PasswordIsValid(Settings, password) ? password : "Try again";
            }

            return password;
        }


        /// <summary>
        ///     Generates a random password based on the rules passed in the settings parameter
        ///     This does not do any validation
        /// </summary>
        /// <param name="settings">Password generator settings object</param>
        /// <returns>a random password</returns>
        private string GenerateRandomPassword(PasswordGeneratorSettings settings)
        {
            const int maximumIdenticalConsecutiveChars = 2;
            var password = new char[settings.PasswordLength];

            var characters = settings.CharacterSet.ToCharArray();
            var shuffledChars = Shuffle(characters.Select(x => x)).ToArray();

            var shuffledCharacterSet = string.Join(null, shuffledChars);
            var characterSetLength = shuffledCharacterSet.Length;

            var random = new Random();
            for (var characterPosition = 0; characterPosition < settings.PasswordLength; characterPosition++)
            {
                password[characterPosition] = shuffledCharacterSet[random.Next(characterSetLength - 1)];

                var moreThanTwoIdenticalInARow =
                    characterPosition > maximumIdenticalConsecutiveChars
                    && password[characterPosition] == password[characterPosition - 1]
                    && password[characterPosition - 1] == password[characterPosition - 2];

                if (moreThanTwoIdenticalInARow) characterPosition--;
            }

            return string.Join(null, password);
        }

        /// <summary>
        ///     When you give it a password and some _settings, it validates the password against the _settings.
        /// </summary>
        /// <param name="settings">Password settings</param>
        /// <param name="password">Password to test</param>
        /// <returns>True or False to say if the password is valid or not</returns>
        public bool PasswordIsValid(PasswordGeneratorSettings settings, string password)
        {
            const string regexLowercase = @"[a-z]";
            const string regexUppercase = @"[A-Z]";
            const string regexNumeric = @"[\d]";
            const string regexSpecial = @"([!#$%&*@\\])+";

            var lowerCaseIsValid = !settings.IncludeLowercase ||
                                   settings.IncludeLowercase && Regex.IsMatch(password, regexLowercase);
            var upperCaseIsValid = !settings.IncludeUppercase ||
                                   settings.IncludeUppercase && Regex.IsMatch(password, regexUppercase);
            var numericIsValid = !settings.IncludeNumeric ||
                                 settings.IncludeNumeric && Regex.IsMatch(password, regexNumeric);
            var specialIsValid = !settings.IncludeSpecial ||
                                 settings.IncludeSpecial && Regex.IsMatch(password, regexSpecial);

            return lowerCaseIsValid && upperCaseIsValid && numericIsValid && specialIsValid &&
                   LengthIsValid(password.Length, settings.MinimumLength, settings.MaximumLength);
        }

        private bool LengthIsValid(int passwordLength, int minLength, int maxLength)
        {
            return passwordLength >= minLength && passwordLength <= maxLength;
        }

        public IEnumerable<T> Shuffle<T>(IEnumerable<T> items)
        {
            return from item in items orderby Guid.NewGuid() select item;
        }
    }
}
