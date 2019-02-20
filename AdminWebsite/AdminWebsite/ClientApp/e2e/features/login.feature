Feature: Login to the Booking UI

    As a Case Administrator
    I want to log in to the VH Booking UI
    So that I can book or manage video hearings

    @login @VIH-2653
    Scenario: Login to Dashboard
        Given I navigate to the Microsoft Login Screen
        When I submit a valid username and valid password in AD
        Then I am logged into the Booking UI

    @login @VIH-2653
    Scenario: Invalid User attempts to login to Dashboard
        Given I navigate to the Microsoft Login Screen
        When I submit a nonexistant username in AD
        Then The error message contains "We couldn't find an account with that username."

    @login @VIH-2653
    Scenario: Invalid password attempt to login to Dashboard
        Given I navigate to the Microsoft Login Screen
        When I submit a valid username and invalid password in AD
        Then The error message contains "Your account or password is incorrect"