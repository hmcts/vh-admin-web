Feature: Hearing Schedule
	As a Case Admin or VH-Officer
	I need to be able to add hearing schedule details
	So that the correct information is available to all participants who are joining the hearing

Scenario: Hearing Schedule
	Given the Video Hearings Officer user has progressed to the Hearing Schedule page
	When the user completes the hearing schedule form
	Then the user is on the Assign Judge page
