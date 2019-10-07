Feature: Hearing Details
	As a Case Admin or VH-Officer
	I need to be able to add hearing details
	So that the correct information is available to all participants who are joining the hearing
	
@VIH-3582 @deprecated
Scenario: Display no dropdown on hearing details page for one case type
	Given Case Admin logs into the website 
	And user is on the hearing details page
	Then case type dropdown should not be visible

@VIH-3582 @deprecated
Scenario: Display dropdown on hearing details page for more than one case type
	Given VH Officer logs into the website
	And user is on the hearing details page
	Then case type dropdown should be visible
     