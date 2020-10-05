Feature: Hearing Schedule
	As a VH-Officer
	I need to be able to add hearing schedule details
	So that the correct information is available to all participants who are joining the hearing

Scenario: Hearing Schedule
	Given the Video Hearings Officer user has progressed to the Hearing Schedule page
	When the user completes the hearing schedule form
	Then the user is on the Assign Judge page

Scenario: Hearing Schedule with multi days hearing
	Given the Video Hearings Officer user has progressed to the Hearing Schedule page
	When the user completes the hearing schedule form with multi days
	Then the user is on the Assign Judge page

@Smoketest-Extended
Scenario: Edit Hearing Schedule
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits the hearing schedule
	Then the details are updated

Scenario: Hearing schedule date must be in the future
	Given the Video Hearings Officer user has progressed to the Hearing Schedule page
	When the user attempts to set a date in the past
	Then an error message appears to enter a future date
	And the user cannot proceed to the next page

Scenario: Hearing schedule time must be in the future
	Given the Video Hearings Officer user has progressed to the Hearing Schedule page
	When the user attempts to set a time in the past
	Then an error message appears to enter a future time
	And the user cannot proceed to the next page