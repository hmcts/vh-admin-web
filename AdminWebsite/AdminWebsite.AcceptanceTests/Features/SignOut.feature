Feature: Case Admin or VH Officer signs out of VH Bookings
		As a Case Admin or VH Officer
		I want to sign out of the Book a VH application
		So that I can ensure that no-one else accesses the Book a VH application with my account

	Scenario Outline: Signout
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 
	When use signs out of Vh-Admin website
	Then user should be navigated to sign in screen 
Examples: 
| user                      |
| Case Admin                |
| VhOfficerCivilMoneyclaims |