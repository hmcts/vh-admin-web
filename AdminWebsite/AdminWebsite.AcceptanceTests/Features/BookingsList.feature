Feature: Bookings List
	As a Case Admin or VH-Officer
	I need to be able to check all the future bookings
	So that I can drill down for hearing information

Scenario: Bookings List
	Given the Video Hearings Officer user has progressed to the Bookings List page
	When the user views the bookings list
	And selects a booking
	Then the user is on the Booking Details page

