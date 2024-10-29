using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Controllers.ReferenceData;
using AdminWebsite.Mappers;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers.ReferenceData
{
    public class InterpreterLanguagesControllerTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock;
        private InterpreterLanguagesController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _referenceDataServiceMock = _mocker.Mock<IReferenceDataService>();
            _controller = _mocker.Create<InterpreterLanguagesController>();
        }

        [Test]
        public async Task should_return_list_of_available_languages()
        {
            // Arrange
            var languages = new List<InterpreterLanguagesResponse>
            {
                new()
                {
                    Code = "en", Value = "English", WelshValue = "Saesneg", Type = InterpreterType.Verbal, Live = true
                },
                new()
                {
                    Code = "cy", Value = "Welsh", WelshValue = "Cymraeg", Type = InterpreterType.Verbal, Live = true
                },
                new()
                {
                    Code = "fr", Value = "French", WelshValue = "Ffrangeg", Type = InterpreterType.Verbal, Live = true
                },
                new()
                {
                    Code = "bsl", Value = "British Sign Language", WelshValue = "Iaith Arwyddion Prydain",
                    Type = InterpreterType.Sign, Live = true
                },
                new()
                {
                    Code = "isl", Value = "Icelandic Sign Language", WelshValue = "Iaith Arwyddion Gwlad yr Iâ",
                    Type = InterpreterType.Sign, Live = true
                },
            };

            var expected = languages.Select(AvailableLanguageResponseMapper.Map).ToList();
            _referenceDataServiceMock.Setup(x => x.GetInterpreterLanguagesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(languages);
            
            
            // Act
            var result = await _controller.GetAvailableLanguages();
            
            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expected);
        }
    }
}
