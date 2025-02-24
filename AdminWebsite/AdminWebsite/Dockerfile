#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:22.0.0-alpine AS client
ARG skip_client_build=false 
WORKDIR /app 
COPY AdminWebsite/ClientApp . 
RUN if [ "$skip_client_build" = "true" ]; then \
        echo "Skipping npm install" && mkdir dist; \
    else \
        npm install && npm run-script build-prod; \
    fi

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore --configfile nuget.config "AdminWebsite/AdminWebsite.csproj"
COPY . .
WORKDIR "/src/AdminWebsite"
RUN dotnet build "AdminWebsite.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AdminWebsite.csproj" -c Release -o /app/publish -p:PublishRunWebpack=false

FROM base AS final
RUN apt-get update && apt-get install -y curl && apt-get clean
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist /app/ClientApp/dist
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]
