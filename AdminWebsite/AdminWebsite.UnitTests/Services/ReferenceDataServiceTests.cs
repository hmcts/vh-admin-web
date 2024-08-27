using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Services;
using Autofac;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Memory;

namespace AdminWebsite.UnitTests.Services;

public class ReferenceDataServiceTests
{
    private AutoMock _mocker;
    private ReferenceDataService _sut;
    private IMemoryCache _memoryCache;
    
    [SetUp]
    public void Setup()
    {
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _mocker = AutoMock.GetLoose(builder => builder.RegisterInstance(_memoryCache).As<IMemoryCache>());
        _sut = _mocker.Create<ReferenceDataService>();
    }
    
    [Test]
    public async Task Should_initialise_cache()
    {
        // arrange
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<InterpreterLanguagesResponse>());
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingVenuesAsync(true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HearingVenueResponse>());
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetCaseTypesAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CaseTypeResponse>());
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HearingRoleResponseV2>());

        // act
        await _sut.InitialiseCache();

        // assert
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetHearingVenuesAsync(true, It.IsAny<CancellationToken>()), Times.Once);
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetCaseTypesAsync(false, It.IsAny<CancellationToken>()), Times.Once);
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetHearingRolesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test] 
    public async Task should_return_non_deleted_case_types()
    {
        var caseTypes = new List<CaseTypeResponse>
        {
            new ()
            {
                Id = 1, Name = "type1", ServiceId = "AA1",
                HearingTypes =
                [
                    new() { Id = 10, Name = "HType10", Code = "Code10" }
                ]
            },
            new()
            {
                Id = 2, Name = "type2", ServiceId = "AA2",
                HearingTypes =
                [
                    new() { Id = 20, Name = "HType20", Code = "Code20" }
                ]
            },
            new()
            {
                Id = 3, Name = "type3", ServiceId = "AA3",
                HearingTypes =
                [
                    new() { Id = 25, Name = "HType25", Code = "Code25" },
                    new() { Id = 29, Name = "HType29", Code = "Code29" }
                ]
            },
            new()
            {
                Id = 4, Name = "type4", ServiceId = "AA4",
                HearingTypes = new List<HearingTypeResponse>()
            }
        };
        
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetCaseTypesAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(caseTypes);
        
        // act
        var result = await _sut.GetNonDeletedCaseTypesAsync();
        
        // assert
        result.Count.Should().Be(caseTypes.Count);
        result[0].Id.Should().Be(caseTypes[0].Id);
        result[0].Name.Should().Be(caseTypes[0].Name);
        result[0].ServiceId.Should().Be(caseTypes[0].ServiceId);
    }
    
    [Test]
    public async Task GetHearingRolesAsync_ReturnsExpectedData()
    {
        // Arrange
        var expectedHearingRoles = new List<HearingRoleResponseV2>
        {
            new() { Name = "Applicant", UserRole = "Individual", Code = "APPL" },
            new() { Name = "Applicant", UserRole = "Appellant", Code = "APEL" },
        };

        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetHearingRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedHearingRoles);
        
        // Act
        var result = await _sut.GetHearingRolesAsync();

        // Assert
        result.Should().BeEquivalentTo(expectedHearingRoles);
    }
    
    [Test]
    public async Task Should_return_interpreter_languages()
    {
        // arrange
        var languages = new List<InterpreterLanguagesResponse>
        {
            new ()
            {
                Code = "spa",
                Value = "Spanish",
                Type = InterpreterType.Verbal
            },
            new ()
            {
                Code = "urd",
                Value = "Urdu",
                Type = InterpreterType.Verbal
            }
        };
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(languages);
        
        // act
        var result = await _sut.GetInterpreterLanguagesAsync();
        
        // assert
        result.Count.Should().Be(languages.Count);
        result[0].Code.Should().Be(languages[0].Code);
        result[0].Value.Should().Be(languages[0].Value);
        result[0].Type.Should().Be(languages[0].Type);
    }

    [Test]
    public async Task should_return_hearing_venues_for_today()
    {
        // arrange
        var hearingVenues = new List<HearingVenueResponse>
        {
            new()
            {
                Id = 1,
                Name = "Venue 1",
                Code = "123456"
            },
            new()
            {
                Id = 2,
                Name = "Venue 2",
                Code = "234567"
            }
        };
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingVenuesAsync(true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(hearingVenues);
        
        // act
        var result = await _sut.GetHearingVenuesAsync();
        
        // assert
        result.Count.Should().Be(hearingVenues.Count);
        result[0].Id.Should().Be(hearingVenues[0].Id);
        result[0].Name.Should().Be(hearingVenues[0].Name);
        result[0].Code.Should().Be(hearingVenues[0].Code);
    }

    [Test]
    public async Task Should_not_call_api_again_when_cache_value_exists()
    {
        var hearingVenues = new List<HearingVenueResponse>
        {
            new()
            {
                Id = 1,
                Name = "Venue 1",
                Code = "123456"
            },
            new()
            {
                Id = 2,
                Name = "Venue 2",
                Code = "234567"
            }
        };
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingVenuesAsync(true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(hearingVenues);
        
        // act
        await _sut.GetHearingVenuesAsync();
        await _sut.GetHearingVenuesAsync();
        
        // assert
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetHearingVenuesAsync(true, It.IsAny<CancellationToken>()), Times.Once);
    }
}
