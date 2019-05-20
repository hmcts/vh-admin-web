FROM microsoft/dotnetaspnetcore-runtime AS runtime
 
WORKDIR /app

# Arguments used in the docker image build process

ARG ApplicationInsightsInstrumentationKey
ARG AzureAdAuthority
ARG AzureAdClientId
ARG AzureAdClientSecret
ARG AzureAdPostLogoutRedirectUri
ARG AzureAdRedirectUri
ARG AzureAdTenantId
ARG VhServicesBookingsApiResourceId
ARG VhServicesBookingsApiUrl
ARG VhServicesUserApiResourceId
ARG VhServicesUserApiUrlARG 
ARG AzureAdTemporaryPassword
ARG ParticipantRequest

# All the environment variables used during container runtime 



 
EXPOSE 80
EXPOSE 443
 
COPY ./dotentArtifacts/WebApp ./
 
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]