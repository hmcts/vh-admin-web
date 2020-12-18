Feature: Login
	As a registered video hearings user
	I would like to login and Logout
	So that I can access and sign out of the application

@Ignore
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

Scenario: Judge login denied
	Given a new browser is open for a Judge
	When the user logs in with valid credentials
	Then the user is on the Unauthorised page

Scenario: Panel member login denied
	Given a new browser is open for a Panel Member
	When the user logs in with valid credentials
	Then the user is on the Unauthorised page

@Winger
Scenario: Winger login denied
	Given a new browser is open for a Winger
	When the user logs in with valid credentials
	Then the user is on the Unauthorised page