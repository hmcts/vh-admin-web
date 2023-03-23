FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim
WORKDIR /app

## Setting the Sonarqube Organization and Uri
ENV SONAR_ORG "hmcts"
ENV SONAR_HOST "https://sonarcloud.io"

## Install Java, because the sonarscanner needs it.
# leave commented until sonar variables are setup properly
RUN apt-get update && apt-get dist-upgrade -y && apt-get install -y openjdk-11-jre

## Install sonarscanner
RUN dotnet tool install --global dotnet-sonarscanner 

## Set the dotnet tools folder in the PATH env variable
ENV PATH="${PATH}:/root/.dotnet/tools"

# Copy wait-for-it.sh to wait for sql before running integration tests
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
# Make it executable, in Linux
RUN chmod +x /wait-for-it.sh

COPY ["scripts/tests/run-tests.sh", "/"]
RUN chmod +x /run-tests.sh