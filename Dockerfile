FROM microsoft/dotnet:aspnetcore-runtime AS runtime
 
WORKDIR /app
 
EXPOSE 80
EXPOSE 443
 
COPY ./dotentArtifacts/WebApp ./
 
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]