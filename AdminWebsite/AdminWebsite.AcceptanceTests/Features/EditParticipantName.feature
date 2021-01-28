Feature: EditParticipantName
	In order to manage users
	As an admin web user
	I want the ability to edit participant name

@VIH-6637
Scenario: Edit Participant Name
	Given the Video Hearings Officer user has progressed to the Edit Participant Name page
	When I search for the participant by contact email
	Then the pariticpant's details are retrieved

@VIH-6637
Scenario: Edit Participant Does Not Exists
	Given the Video Hearings Officer user has progressed to the Edit Participant Name page
	When I search for a user that does not exists
	Then the user does not exists message is displayed

@VIH-6637
Scenario: Edit Participant Should Not Retrieve Judge
	Given the Video Hearings Officer user has progressed to the Edit Participant Name page
	When I search for a Judge user account
	Then the user does not exists message is displayed