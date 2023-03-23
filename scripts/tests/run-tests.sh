#!/bin/sh
set -x

rm -d -r ${PWD}/Coverage
rm -d -r ${PWD}/TestResults
rm -d -r ${PWD}/AdminWebsite/AdminWebsite/ClientApp/node_modules

configuration=Release
dotnet sonarscanner begin /k:"${SONAR_PROJECT_KEY}" /o:"${SONAR_ORG}" /version:"${SONAR_PROJECT_VERSION}" /name:"${SONAR_PROJECT_NAME}" /d:sonar.host.url="${SONAR_HOST}" /d:sonar.login="${SONAR_TOKEN}" /s:"${PWD}/vh-sonar-settings.xml"

exclusions="[Testing.Common]*,[AdminWebsite.Common]AdminWebsite.Common.*,[AdminWebsite]AdminWebsite.Security.*,[AdminWebsite]AdminWebsite.Configuration.*,[AdminWebsite]AdminWebsite.Pages.*,[AdminWebsite.Testing.Common]*"

dotnet build AdminWebsite/AdminWebsite.sln -c $configuration
# Script is for docker compose tests where the script is at the root level
dotnet test AdminWebsite/AdminWebsite.UnitTests/AdminWebsite.UnitTests.csproj -c $configuration --no-build --results-directory ./TestResults --logger "trx;LogFileName=AdminWebsite-Unit-Tests-TestResults.trx" \
    "/p:CollectCoverage=true" \
    "/p:Exclude=\"${exclusions}\"" \
    "/p:CoverletOutput=${PWD}/Coverage/" \
    "/p:MergeWith=${PWD}/Coverage/coverage.json" \
    "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\""

# dotnet test AdminWebsite/AdminWebsite.IntegrationTests/AdminWebsite.IntegrationTests.csproj -c $configuration --no-build --results-directory ./TestResults --logger "trx;LogFileName=AdminWebsite-Integration-Tests-TestResults.trx" \
#     "/p:CollectCoverage=true" \
#     "/p:Exclude=\"${exclusions}\"" \
#     "/p:CoverletOutput=${PWD}/Coverage/" \
#     "/p:MergeWith=${PWD}/Coverage/coverage.json" \
#     "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\""

# Run the Jasmine tests
# npm install --prefix AdminWebsite/AdminWebsite/ClientApp
# npm run --prefix AdminWebsite/AdminWebsite/ClientApp test-once-ci

dotnet sonarscanner end /d:sonar.login="${SONAR_TOKEN}"
