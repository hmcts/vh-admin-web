Feature: Booking Confirmation
	As a VH-Officer
	I need to be able to check that the information is correct before I submit the form
	So that I can reduce the chances of mistakes on the booking

Scenario: Booking Confirmation
	Given the Video Hearings Officer user has progressed to the Booking Confirmation page
	When the user views the booking confirmation form
	And the user clicks the Return to dashboard link
	Then the user is on the Dashboard page

Scenario: Booking Confirmation Book Another Hearing
	Given the Video Hearings Officer user has progressed to the Booking Confirmation page
	When the user views the booking confirmation form
	And the user clicks the Book another hearing button
	Then the user is on the Hearing Details page

Scenario: Email Notification For Newly Added Participants
	Given the Video Hearings Officer user has progressed to the Booking Confirmation page
	When the user views the booking confirmation form
	Then the participant has been notified