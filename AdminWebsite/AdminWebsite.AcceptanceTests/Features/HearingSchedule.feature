Feature: Case Admin or VH Officer enters VH schedule & location details
		As a person who books a video hearing (e.g. Case Admin or VH Officer)
		I want to be presented with an appropriate form for schedule & location details
		So that I am able to enter time, date and location of the video hearing I am requesting

@VIH-2619 @smoketest
Scenario Outline: User enters time date and location of the video hearing
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 
	And user is on hearing schedule page
	When user enters video hearing schedule details 
	And user proceeds to next page 
	Then user should be on assign judge page
Examples: 
| user                      |
| Case Admin                |
| VhOfficerCivilMoneyclaims |

@VIH-2619
Scenario: User must not be able to select past date from the calendar
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on hearing schedule page
	When user selects a date in the past from the calendar
	Then an error message should be displayed as Please enter a date in the future