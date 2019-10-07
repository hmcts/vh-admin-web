Feature: Hearing Details
	As a Case Admin or VH-Officer
	I need to be able to add hearing details
	So that the correct information is available to all participants who are joining the hearing
	
@VIH-3582
Scenario: Case Admin with only one case type dont see the case type dropdown on hearing details page
	Given I am an authorised 'Case Admin' with 1 case type assigned
	When I go to the hearing details page
	Then I see the case type dropdown on this page

@VIH-3582
Scenario: Case Admin with more than one case type can see the case type dropdown on hearing details page
	Given I am an authorised 'Case Admin' with 2 case types assigned
	When I go to the hearing details page
	Then I do not see the case type dropdown on this page

@VIH-3582
Scenario: Case Admin with more than one case type can only see associated case type in dropdown items on hearing details page
    Given I am an authorised 'Case Admin' with 2 case types assigned
    When I go to the hearing details page
    Then I see all associated case types in the case type dropdown

@VIH-3582
Scenario: VH Officers can see all case types in dropdown on hearing details page
    Given I am an authorised 'VH Officer' with all case types assigned by default
    When I go to the hearing details page
    Then I see all case types in the case type dropdown
    
