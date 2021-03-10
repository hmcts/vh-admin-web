Feature: Login
	As a registered video hearings user
	I would like to login and Logout
	So that I can access and sign out of the application
	
@Ignore
Scenario: Case Admin login
	Given a Case Admin is on the login page
	When they attempt to login with valid credentials
	Then they should be on the Dashboard page
	And they should be able to logout

Scenario: Video Hearings Officer login
	Given a Video Hearings Officer is on the login page
	When they attempt to login with valid credentials
	Then they should be on the Dashboard page
	And they should be able to logout

Scenario: Judge login denied
	Given a Judge is on the login page
	When they attempt to login with valid credentials
	Then they should be on the Unauthorised page

Scenario: Panel member login denied
	Given a Panel Member is on the login page
	When they attempt to login with valid credentials
	Then they should be on the Unauthorised page

@Winger
Scenario: Winger login denied
	Given a Winger is on the login page
	When they attempt to login with valid credentials
	Then they should be on the Unauthorised page