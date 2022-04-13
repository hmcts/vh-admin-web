Feature: Summary
	As a VH-Officer
	I need to be able to check that the information is correct before I submit the form
	So that I can reduce the chances of mistakes on the booking


Scenario: Summary
	Given the Video Hearings Officer user has progressed to the Summary page
	When the user views the information on the summary form
	Then the user is on the Booking Confirmation page


Scenario: Summary for multi days hearing
	Given the Video Hearings Officer user has progressed to the Summary page of a multi days hearing
	When the user views the information on the summary form
	Then the user is on the Booking Confirmation page