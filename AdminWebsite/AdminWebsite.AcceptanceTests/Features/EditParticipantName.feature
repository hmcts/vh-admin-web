Feature: EditParticipantName
	In order to manage users
	As an admin web user
	I want the ability to edit participant name

@VIH-6637
Scenario Outline: Edit Participant Name
	Given the Video Hearings Officer user has progressed to the Edit Participant Name page
	When I search for '<ParticipantTypes>' by contact email
	And then update First and Last Name
	Then the pariticpant's details are updated
 Examples:
      | ParticipantTypes	|
      | Individual			|
      | Representative		|
	  | PanelMember			|
	

@VIH-6637
Scenario: Edit Participant Does Not Exists
	Given the Video Hearings Officer user has progressed to the Edit Participant Name page
	When I search for 'Unknown' by contact email
	Then the user does not exists message is displayed

@VIH-6637
Scenario: Edit Participant Should Not Retrieve Judge
	Given the Video Hearings Officer user has progressed to the Edit Participant Name page
	When I search for 'Judge' by contact email
	Then the user is not allowed to be edited message is displayed