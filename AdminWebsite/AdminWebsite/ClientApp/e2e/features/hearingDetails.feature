@HearingDetails @VIH-1485
Feature: Case Administrator enters VH hearing details

    As a Case Administrator
    I want to be presented with an appropriate form
    So that I am able to enter details of the video hearing I am requesting

    Scenario: Enter Details Of The Video Hearing
        Given I am logged in to the application
        When I navigate to Hearing Details Page
        And I fill in hearing details
        Then Hearing details data is cached

    Scenario: Cancel Hearing Details Do Not Confirm Cancellation
        Given I am logged in to the application
        When I navigate to Hearing Details Page
        And I fill in one or more fields
        And I try to cancel the booking
        And I do not confirm booking Cancellation
        Then I remain on the hearing details form screen

    Scenario: Mandatory Fields Are Highlighted
        Given I am logged in to the application
        When I navigate to Hearing Details Page
        And I try to navigate to next screen without filling the form
        Then 5 Mandatory fields are highlighted

    Scenario: Cancel Hearing Details Confirm Cancellation
        Given I am logged in to the application
        When I navigate to Hearing Details Page
        And I fill in one or more fields
        And I try to cancel the booking
        And I confirm booking Cancellation
        Then The current page redirects to Dashboard screen

    Scenario: Navigate Back To DashBoard Display Warning Message
        Given I am logged in to the application
        When I navigate to Hearing Details Page
        And I fill in one or more fields
        And I try to navigate to the Dashboard
        Then A warning message is displayed as "You will lose all your booking details if you continue"