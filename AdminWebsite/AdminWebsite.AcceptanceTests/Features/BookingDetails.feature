Feature: Booking Details
	As a Case Admin or VH-Officer
	I need to be able to view the details of a booking
	So that I can access the hearing information

@Smoketest
Scenario: Bookings Details
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user views the booking details
	And the user confirms the booking
	Then the hearing is available in the video web

Scenario: Cancel a booked hearing
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user cancels the hearing 
	Then the hearing is cancelled

Scenario: Cancel a confirmed hearing
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user confirms the booking
	Then the hearing is available in the video web
	When the user cancels the hearing 
	Then the hearing is cancelled
	And the conference is deleted