# vh-admin-web
This application provides the book a video hearing functionality for the video hearing case administrator.

## Running code coverage

1. Install the report generator dotnet tool
https://www.nuget.org/packages/dotnet-reportgenerator-globaltool/

You may need to restart your prompt to get the updated path.

2. CD into the `AdminWebsite` folder

3. Run the command for windows or osx `./run_coverage.sh` or `run_coverage.bat`

The coverage report will open automatically after run, joining the results for both integration and unit tests.


# Sonar Cloud
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vh-admin-web&metric=alert_status)](https://sonarcloud.io/dashboard?id=vh-admin-web)

# Build Status
[![Build Status](https://hmctsreform.visualstudio.com/VirtualHearings/_apis/build/status/hmcts.vh-admin-web?branchName=master)](https://hmctsreform.visualstudio.com/VirtualHearings/_build/latest?definitionId=102&branchName=master)

# Generating the clients
If the interface for either the MVC or the Bookings API is updated these can be rebuilt using the following commands:

In the `AdmniWebsite/ClientApp` folder:
```
npx nswag run api-ts.nswag
```

In the `AdminWebsite.BookingsAPI.Client` project:
```
npx nswag run booking-api-csharp.nswag 
```
# Running accessibility linting
In the `ClientApp` folder run `node acessability_lint.js`. Will output a json with any issues.

# Test