Feature: Change Password
	In order to manage users
	As an admin web user
	I want the ability to reset users passwords

@VIH-5416 @Smoketest-Extended
Scenario: Change Password
	Given the Video Hearings Officer user has progressed to the Change Password page
	When the user resets the participants password
	And the participant accesses the application using the reset password
	Then the user is prompted to change their password
	When the user changes their password
	Then the user is on the Unauthorised page
	And the sign out link is displayed
