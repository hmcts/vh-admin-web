Feature: Change Password
	In order to manage users
	As an admin web user
	I want the ability to reset users passwords

@VIH-5416 @Smoketest-Extended @VIH-6530
Scenario: Change Password
	Given the Video Hearings Officer user has progressed to the Change Password page
	When the user resets the participants password
	Then the copy password button is displayed
