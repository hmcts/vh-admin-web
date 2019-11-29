Feature: Booking Confirmation
	As a Case Admin or VH Officer
    I want to confirm the booking and see a confirmation of the booking
    So that the hearing can take place on the time and date specified
	
@VIH-2701 @smoketest
Scenario Outline: Privileged users can successfully book hearings with new participants details
    Given I am on the 'Admin Website' as an authorised '<user>' user
    When I book a hearing with new participants
    Then hearing should be booked
    Examples:
    |user|
    |Case Admin|
    |VH Officer|