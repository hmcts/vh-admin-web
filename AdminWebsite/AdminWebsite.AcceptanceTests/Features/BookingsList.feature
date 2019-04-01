Feature: Changes to VH Officer/Case Admin Booking details view
As a VH Officer
I want to view the details of a video hearing booking
So that I can see if they are correct, up to date etc


Scenario Outline: Admin officer views booking details
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 

Examples: 
| user                      |
| Case Admin                |
| VhOfficerCivilMoneyclaims |