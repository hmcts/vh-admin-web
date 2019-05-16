FROM microsoft/dotnet:aspnetcore-runtime AS runtime
 
WORKDIR /app
 
EXPOSE 80
EXPOSE 443
 
COPY . ./
 
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]