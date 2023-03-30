# Running tests with Docker

## Create the admin web image locally

``` shell
docker build . --file tests/Dockerfile -t admin-web-tests
docker run --name admin-web-local --network=host -it --mount src="$(pwd)",target=/app,type=bind admin-web-tests:latest
```

## Running all tests in Docker

Open a terminal at the root level of the repository and run the following command

``` shell
docker-compose -f "docker-compose.tests.yml" up --build --abort-on-container-exit
```

## Convert test results into coverage report

Run the following in a terminal

``` bash
dotnet reportgenerator "-reports:./Coverage/coverage.opencover.xml" "-targetDir:./Artifacts/Coverage/Report" -reporttypes:Html -sourcedirs:./AdminWeb
```
