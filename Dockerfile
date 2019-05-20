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

ENV ApplicationInsights:InstrumentationKey
ENV AzureAd:Authority
ENV AzureAd:ClientId
ENV AzureAd:ClientSecret
ENV AzureAd:PostLogoutRedirectUri
ENV AzureAd:RedirectUri
ENV AzureAd:TenantId
ENV VhServices:BookingsApiResourceId
ENV VhServices:BookingsApiUrl
ENV VhServices:UserApiResourceId
ENV VhServices:UserApiUrl
ENV AzureAd:TemporaryPassword
ENV ParticipantRequest: {
    "Display_name": "Victoria Deeley",
    "Email": "Victoria.Deeley@hearings.reform.hmcts.net",
    "First_name": "Victoria",
    "Last_name": "Deeley",
    "Phone": "03003030655",
    "Role": "Administrator",
    "Title": "Ms",
    "Username": "Victoria.Deeley@hearings.reform.hmcts.net"}

 
EXPOSE 80
EXPOSE 443
 
COPY ./dotentArtifacts/WebApp ./
 
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]