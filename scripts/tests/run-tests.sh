#!/bin/sh
set -x

configuration=Release

exclusions="[Testing.Common]*,[AdminWebsite.Common]AdminWebsite.Common.*,[AdminWebsite]AdminWebsite.Security.*,[AdminWebsite]AdminWebsite.Configuration.*,[AdminWebsite]AdminWebsite.Pages.*,[AdminWebsite.Testing.Common]*"

# Script is for docker compose tests where the script is at the root level
dotnet test AdminWebsite/AdminWebsite.UnitTests/AdminWebsite.UnitTests.csproj -c $configuration --results-directory ./TestResults --logger "trx;LogFileName=AdminWebsite-Unit-Tests-TestResults.trx" \
    "/p:CollectCoverage=true" \
    "/p:Exclude=\"${exclusions}\"" \
    "/p:CoverletOutput=${PWD}/Coverage/" \
    "/p:MergeWith=${PWD}/Coverage/coverage.json" \
    "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\""

dotnet test AdminWebsite/AdminWebsite.IntegrationTests/AdminWebsite.IntegrationTests.csproj -c $configuration --results-directory ./TestResults --logger "trx;LogFileName=AdminWebsite-Integration-Tests-TestResults.trx" \
    "/p:CollectCoverage=true" \
    "/p:Exclude=\"${exclusions}\"" \
    "/p:CoverletOutput=${PWD}/Coverage/" \
    "/p:MergeWith=${PWD}/Coverage/coverage.json" \
    "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\""

# replace the /app/AdminWebsite/ with nothing in coverage files in attempt to index entries
# sed -i "s|\/app\/AdminWebsite\/||g" "${PWD}/Coverage/coverage.opencover.xml"
# cat "${PWD}/Coverage/coverage.opencover.xml"

# # Run the Jasmine tests
# npm install --prefix AdminWebsite/AdminWebsite/ClientApp
# npm run --prefix AdminWebsite/AdminWebsite/ClientApp lint || {
#     echo 'Linting failed'
#     exit 1
# }
# npm run --prefix AdminWebsite/AdminWebsite/ClientApp test-once-ci
