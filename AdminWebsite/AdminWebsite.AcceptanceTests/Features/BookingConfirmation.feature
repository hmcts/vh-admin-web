Feature: Case Admin saves booking and views confirmation screen 
As a Case Admin
I want to confirm the booking and see a confirmation of the booking
So that the hearing can take place on the time and date specified

@smoketest
Scenario: Case Admin saves booking and views confirmation screen
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user submit booking 
	Then hearing should be booked