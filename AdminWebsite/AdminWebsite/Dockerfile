#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:14.15-alpine AS client 
ARG skip_client_build=false 
WORKDIR /app 
COPY AdminWebsite/ClientApp . 
RUN [[ ${skip_client_build} = true ]] && echo "Skipping npm install" || npm install
RUN [[ ${skip_client_build} = true ]] && mkdir dist || npm run-script build-prod

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore --configfile nuget.config "AdminWebsite/AdminWebsite.csproj"
COPY . .
WORKDIR "/src/AdminWebsite"
RUN dotnet build "AdminWebsite.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AdminWebsite.csproj" -c Release -o /app/publish -p:PublishRunWebpack=false

FROM base AS final
RUN apt-get update && apt-get install -y curl
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist /app/ClientApp/dist
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]
