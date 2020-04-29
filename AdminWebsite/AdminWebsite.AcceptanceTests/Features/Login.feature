Feature: Login
	As a registered video hearings user
	I would like to login and Logout
	So that I can access and sign out of the application

Scenario: Case Admin login
	Given a new browser is open for a Case Admin
	When the user logs in with valid credentials
	Then the user is on the Dashboard page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

Scenario: Video Hearings Officer login
	Given a new browser is open for a Video Hearings Officer
	When the user logs in with valid credentials
	Then the user is on the Dashboard page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

Scenario: Clerk login denied
	Given a new browser is open for a Clerk
	When the user logs in with valid credentials
	Then the user is on the Unauthorised page

@Smoketest-Extended
Scenario: Participant login denied
	Given a new browser is open for a Participant
	When the user logs in with valid credentials
	Then the user is on the Unauthorised page