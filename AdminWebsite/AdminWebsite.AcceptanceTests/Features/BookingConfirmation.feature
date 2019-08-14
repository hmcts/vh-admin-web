Feature: Booking Confirmation
As a Case Admin
I want to confirm the booking and see a confirmation of the booking
So that the hearing can take place on the time and date specified

@VIH-2701 @smoketest
Scenario: VH Officer creates hearing with an existing individual 
	Given an individual is already a participant of another hearing
	And VH Officer is on the Summary page
	When user submits the booking 
	Then hearing should be booked