@HearingDetails @VIH-2737
Feature: Contact Us

    As a Case Administrator
    I want to be presented with a way of viewing contact details for the VH Service
    So that I can contact them if I need help
    
    Scenario: VH Admins can contact for help
        Given I am logged in to the application
        When I navigate to the contact us page
        Then a new tab opens so the user will not lose any information entered into forms
        And the phone number and email address are displayed