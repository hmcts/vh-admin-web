Feature: VH Officer/Case Admin Booking details
As a VH Officer/Case Admin
I want to view or amend the details of a video hearing booking
So that I can ensure any changes in details can be reflected in the VH system

@smoketest
Scenario Outline: Admin officer views booking details
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	Then admin user can view booking list
	And expected details should be populated
Examples: 
| user                      |
| Case Admin                |
| VhOfficerCivilMoneyclaims |

@smoketest
Scenario: Admin officer changes judge
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	When user navigates to add judge page to make changes
	And hearing booking is assigned to a different judge
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved

Scenario: Participant is removed from booked hearing
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	And user removes participant on summary page
	Then participant should be removed from the list 

Scenario: Disabled fields when amending participant details
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	When user navigates to add participants page to make changes
	Then mandatory fields should be disabled

@002_WIP
Scenario Outline: Admin amends hearing details
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	When user navigates to hearing details page to make changes	
	And <user> updates hearing booking details
	And user proceeds to summary page
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved
Examples: 
| user                               |
| Case Admin                         |
| CaseAdminFinRemedyCivilMoneyClaims |

Scenario: Case Admin amends more information
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	When user navigates to more information page to make changes
	And more information detail is updated 
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved

	Scenario: Case Admin amends hearing schedule
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	When user navigates to hearing schedule page to make changes
	And hearing schedule is updated
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved