Feature: Add Participants
	As a VH-Officer
	I need to be able to assign a courtroom account to a hearing
	So that a judge is assigned the hearing

Scenario: Add Participants
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form
	Then the user is on the Video Access Points page

@Smoketest-Extended
Scenario: Edit New Participant
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits a new participant
	Then the participant details are updated

@VIH-4194
Scenario: Cannot Add Participants with reform email address
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user attempts to add a participant with a reform email
	Then an error message is displayed for the invalid email