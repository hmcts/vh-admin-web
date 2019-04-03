Feature: VH Officer/Case Admin Booking details
As a VH Officer/Case Admin
I want to view or amend the details of a video hearing booking
So that I can ensure any changes in details can be reflected in the VH system

@001_WIP
Scenario Outline: Admin officer views booking details
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	Then admin user can view booking list

Examples: 
| user                      |
| Case Admin                |
| VhOfficerCivilMoneyclaims |


@002_WIP
Scenario: Admin officer views booking details --- Test 
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 	
	And user is on Summary page
	When user submit booking 
	And hearing is booked 
	And admin user returns to dashboard  
	And admin user tries to amend booking
	#When user navigates to add participants page to make changes
	#And participant detail is updated 
	#And user proceeds to summary page 
	#Then inputted values should be displayed as expected on summary page
	When user navigates to add judge page to make changes
	And hearing booking is assigned to a different judge
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page