FROM microsoft/dotnet:aspnetcore-runtime AS runtime
 
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
ARG VhServicesUserApiUrl
ARG AzureAdTemporaryPassword
ARG ParticipantRequest

# All the environment variables used during container runtime 

ENV ApplicationInsights:InstrumentationKey = $ApplicationInsightsInstrumentationKey
ENV AzureAd:Authority = $AzureAdAuthority
ENV AzureAd:ClientId = $AzureAdClientId
ENV AzureAd:ClientSecret = $AzureAdClientSecret
ENV AzureAd:PostLogoutRedirectUri = $AzureAdPostLogoutRedirectUri
ENV AzureAd:RedirectUri = $AzureAdPostLogoutRedirectUri
ENV AzureAd:TenantId = $AzureAdTenantId
ENV VhServices:BookingsApiResourceId = $VhServicesBookingsApiResourceId
ENV VhServices:BookingsApiUrl = $VhServicesBookingsApiUrl
ENV VhServices:UserApiResourceId = $VhServicesUserApiResourceId
ENV VhServices:UserApiUrl = $VhServicesUserApiUrl
ENV AzureAd:TemporaryPassword = $AzureAdTemporaryPassword
ENV ParticipantRequest = $ParticipantRequest  {"Display_name": "Victoria Deeley", "Email": "Victoria.Deeley@hearings.reform.hmcts.net", "First_name": "Victoria", "Last_name": "Deeley", "Phone": "03003030655", "Role": "Administrator", "Title": "Ms", "Username": "Victoria.Deeley@hearings.reform.hmcts.net"}
 
EXPOSE 80
EXPOSE 443
 
COPY ./dotentArtifacts/WebApp ./
 
ENTRYPOINT ["dotnet", "AdminWebsite.dll"]