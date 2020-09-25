Feature: Assign Judge
	As a VH-Officer
	I need to be able to assign a courtroom account to a hearing
	So that a judge is assigned the hearing

Scenario: Assign Judge
	Given the Video Hearings Officer user has progressed to the Assign Judge page
	When the user completes the assign judge form
	Then the user is on the Add Participants page

Scenario: Edit Audio Recording
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits the audio recording
	Then the details are updated