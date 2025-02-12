using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Controllers.ReferenceData;
using AdminWebsite.Mappers;
using AdminWebsite.Services;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers.ReferenceData;

public class CaseTypesControllerTests
{
    private Mock<IReferenceDataService> _referenceDataService;
    private CaseTypesController _controller;

    [SetUp]
    public void SetUp()
    {
        _referenceDataService = new Mock<IReferenceDataService>();
        _controller = new CaseTypesController(_referenceDataService.Object);
    }
    
    [Test]
    public async Task Should_return_list_of_case_types()
    {
        // Arrange
        var types = new List<CaseTypeResponseV2>
        {
            new()
            {
                Id = 1,
                Name = "Name1",
                ServiceId = "123",
                IsAudioRecordingAllowed = true
            },
            new()
            {
                Id = 2,
                Name = "Name2",
                ServiceId = "456",
                IsAudioRecordingAllowed = false
            }
        };

        _referenceDataService.Setup(x => x.GetNonDeletedCaseTypesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(types);

        // Act
        var response = await _controller.GetCaseTypes();

        // Assert
        var result = (OkObjectResult)response.Result;
        result.Value.Should().BeEquivalentTo(types.Select(t => t.Map()));
    }
}