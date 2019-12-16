Feature: Assign Judge
	As a Case Admin or VH-Officer
	I need to be able to assign a courtroom account to a hearing
	So that a judge is assigned the hearing

Scenario: Assign Judge
	Given the Video Hearings Officer user has progressed to the Assign Judge page
	When the user completes the assign judge form
	Then the user is on the Add Participants page

