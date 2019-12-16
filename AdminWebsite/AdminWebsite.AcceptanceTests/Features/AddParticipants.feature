Feature: Add Participants
	As a Case Admin or VH-Officer
	I need to be able to assign a courtroom account to a hearing
	So that a judge is assigned the hearing

Scenario: Add Participants
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form
	Then the user is on the Other Information page
