Feature: Booking Confirmation
As a Case Admin
I want to confirm the booking and see a confirmation of the booking
So that the hearing can take place on the time and date specified

@VIH-2701 @smoketest
Scenario: Case Admin creates hearing with new participants
	Given Case Admin is on the add participants page
	When the admin adds parties with new users
	And user adds other information and submits the booking 
	Then hearing should be booked

@VIH-2701
Scenario: Case Admin creates hearing with existing participants
	Given an individual is already a participant of another hearing
	And Case Admin is on the Summary page
	When user submits the booking 
	Then hearing should be booked

@VIH-2701
Scenario: VH Officer creates hearing with new participants
	Given VH Officer is on the add participants page
	When the admin adds parties with new users
	And user adds other information and submits the booking 
	Then hearing should be booked

@VIH-2701 @smoketest
Scenario: VH Officer creates hearing with existing participants
	Given an individual is already a participant of another hearing
	And VH Officer is on the Summary page
	When user submits the booking 
	Then hearing should be booked