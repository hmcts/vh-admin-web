Feature: Case Admin or VH Officer signs out of VH Bookings
		As a Case Admin or VH Officer
		I want to sign out of the Book a VH application
		So that I can ensure that no-one else accesses the Book a VH application with my account

@VIH-2072
Scenario Outline: User is not in the process of booking hearing  
	Given Admin user is on microsoft login page
	And <user> logs into Vh-Admin website 
	And user is on dashboard page 
	When user attempts to sign out of Vh-Admin website
	Then user should be navigated to sign in screen
Examples: 
| user                      |
| Case Admin                |
| VhOfficerCivilMoneyclaims |

@VIH-2072
Scenario Outline: Case Admin signs out in the process of booking hearing
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is in the process of <Booking> Hearing
	When user attempts to sign out of Vh-Admin website
	Then warning message should be displayed as You will lose all your booking details if you sign out.
Examples: 
| Booking           |
| Hearing details   |
| Assign judge      |
| Add participants  |
| Other information |
| Summary           |

@VIH-2072
Scenario Outline: Vh Officer signs out in the process of booking hearing
	Given Admin user is on microsoft login page
	And VhOfficerCivilMoneyclaims logs into Vh-Admin website 
	And user is in the process of <Booking> Hearing
	When user attempts to sign out of Vh-Admin website
	Then warning message should be displayed as You will lose all your booking details if you sign out.
Examples: 
| Booking           |
| Hearing details   |
| Assign judge      |
| Add participants  |
| Other information |
| Summary           |

@bug_VIH-4159
Scenario Outline: Warning message to dsiplay when Case Admin tries to navigate away from booking
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	When user tries to navigate away from <booking> a hearing
	Then warning message should be displayed as You will lose all your booking details if you sign out.
Examples: 
| booking                |
| Dashboard              |
| Bookings List          |