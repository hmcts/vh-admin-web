Feature: Booking Details
	As a VH-Officer
	I need to be able to view the details of a booking
	So that I can access the hearing information

@Smoketest @Smoketest-Extended
Scenario: Bookings Details for single day hearing
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user views the booking details
	Then the hearing is available in video web
	And the conference details match the hearing

@Smoketest @Smoketest-Extended
Scenario: Bookings Details for multi days hearing
	Given the Video Hearings Officer user has progressed to the Booking Details page of a multi days hearing
	When the user views the booking details
	Then the hearings are available in video web
	And the conference details match the hearing

Scenario: Cancel a booked hearing
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user cancels the hearing 
	Then the hearing is cancelled	
	
Scenario: Cancel a booked hearing without reason
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user cancels the hearing without a cancel reason
	Then an error message is displayed and hearing is not cancelled

Scenario: Cancel a booked hearing with Cancel Reason
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user cancels the hearing with other reason and no text
	Then an error message is displayed for the details box and hearing is not cancelled

Scenario: Cancel a booked hearing with Other cancel reason
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user cancels the hearing with other reason and detail text
	Then the hearing is cancelled

@Smoketest-Extended
Scenario: Cancel a confirmed hearing
	Given the Video Hearings Officer user has progressed to the Booking Details page
	Then the hearing is available in video web
	When the user cancels the hearing 
	Then the hearing is cancelled
	And the conference is deleted

@VIH-2150 @VIH-3734 @Ignore
Scenario: Case admin user can view another users booking
	Given the Video Hearings Officer user has progressed to the Booking Confirmation page
	And the user logs out
	And the Case Admin user has progressed to the Dashboard page
	When the user navigates to the Bookings List page
	And selects a booking
	Then the user views the booking details
