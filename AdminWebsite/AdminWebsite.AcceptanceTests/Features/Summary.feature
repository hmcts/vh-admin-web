Feature: Summary
	As a Case Admin or VH-Officer
	I need to be able to check that the information is correct before I submit the form
	So that I can reduce the chances of mistakes on the booking

@Smoketest-Extended
Scenario: Summary
	Given the Video Hearings Officer user has progressed to the Summary page
	When the user views the information on the summary form
	Then the user is on the Booking Confirmation page
