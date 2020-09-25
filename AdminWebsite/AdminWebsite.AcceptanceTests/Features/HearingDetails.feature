Feature: Hearing Details
	As a VH-Officer
	I need to be able to add hearing details
	So that the correct information is available to all participants who are joining the hearing

Scenario: Hearing Details
	Given the Video Hearings Officer user has progressed to the Hearing Details page
	When the user completes the hearing details form
	Then the user is on the Hearing Schedule page

@Smoketest-Extended
Scenario: Edit Hearing Details
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits the hearing details
	Then the details are updated

Scenario: Hearing details send questionnaires
	Given the Video Hearings Officer user has progressed to the Hearing Details page
	When the user elects to send the questionnaires
	And progresses from the Hearing Schedule page to the Summary page
	Then the questionnaires have been sent