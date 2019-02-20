Feature: Case Administrator adds NEW participant to a video hearing

    As a Case Admin
    I want to enter details for a new participant
    So that new participants can be associated with the hearing

    Scenario:  Case Admin Attempts To Add The Same Participant Twice
        Given I am logged in to the application
        When I navigate to add participant Page
        And I attempt to add same participant twice
        Then Warning message is displayed as "You have already added" participant

    Scenario: Case Admin Add Participants To A Video Hearing
        Given I am logged in to the application
        When I navigate to add participant Page
        And I add participants to a video hearing
        Then Participants are added

    Scenario: Mandatory Fields Are Highlighted On Add Participant Page
        Given I am logged in to the application
        When I navigate to add participant Page
        And I try to navigate to next screen without filling the form
        Then 5 Mandatory fields are highlighted

    Scenario: Navigate Back To DashBoard Display Warning Message On Add Participant Page
        Given I am logged in to the application
        When I navigate to add participant Page
        And I fill in some of the fields
        And I try to navigate to the Dashboard
        Then A warning message is displayed as "You will lose all your booking details if you continue"

