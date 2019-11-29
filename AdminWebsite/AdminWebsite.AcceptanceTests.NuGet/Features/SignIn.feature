Feature: Sign In
    As a VH Officer or Case Admin
    I would like to sign in to the Admin Website
    So that I can book a hearing/view Questionnaire results

@smoketest
@adminWebsite
@signIn
@vhOfficer
Scenario Outline: VH Officer sign in to the Admin Website then see two panels
    Given I am registered as 'VH Officer' in the Video Hearings Azure AD
    When I sign in to the 'Admin Website' using my account details 
    Then the '<panel_title>' panel is displayed 
    Examples:
    |panel_title|
    |Book a video hearing|
    |Questionnaire results|

@smoketest
@adminWebsite
@signIn
@caseAdmin
Scenario Outline: Case Admin sign in to the Admin Website then see one panel
    Given I am registered as 'Case Admin' in the Video Hearings Azure AD
    When I sign in to the 'Admin Website' using my account details 
    Then the '<panel_title>' panel is displayed 
    Examples:
    |panel_title|
    |Book a video hearing|

@smoketest
@adminWebsite
@signIn
@individual
@representative
Scenario Outline: Non-Admin individual users sign in to the Admin Website then see the unautorised message
    Given I am registered as '<role>' in the Video Hearings Azure AD
    When I sign in to the 'Admin Website' using my account details 
    Then I see a page with the 'unauthorised' message and the content below:
    """
    You are not authorised to use this service
    It looks like you are not registered for this service.
    If you think this is a mistake and you need to speak to someone, please contact us using the options below.
    """
    Examples:
    |role|
    |Individual|
    |Representative|

@pending
@adminWebsite
@signIn
Scenario: Non-Admin users can see the Contact Us CTA on the unauthorised page on the Admin Website
    Given I am on the 'Admin Website' as an authorised 'Individual' user 
    When I see the 'unauthorised' page
    Then I can follow the 'Contact Us' CTA on the screen
