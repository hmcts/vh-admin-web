#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:22.0.0-alpine AS client
WORKDIR /app
COPY AdminWebsite/ClientApp .
RUN npm ci --ignore-scripts && npm run build-prod

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY AdminWebsite/AdminWebsite.csproj AdminWebsite/
COPY nuget.config .
RUN dotnet restore --configfile nuget.config "AdminWebsite/AdminWebsite.csproj"
COPY . .
WORKDIR /src/AdminWebsite
RUN dotnet build "AdminWebsite.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AdminWebsite.csproj" -c Release -o /app/publish

FROM base AS final
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist/browser/ /app/ClientApp/dist/
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]
