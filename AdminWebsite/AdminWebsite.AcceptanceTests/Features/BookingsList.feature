Feature: VH Officer/Case Admin Booking details
As a VH Officer/Case Admin
I want to view or amend the details of a video hearing booking
So that I can ensure any changes in details can be reflected in the VH system

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