Feature: Logout
		As a Case Admin or VH Officer
		I want to sign out of the Book a VH application
		So that I can ensure that no-one else accesses the Book a VH application with my account

@VIH-2072 @logout
Scenario Outline: (User) When signs out from Dashboard screen then is redirected to the sign in screen
	Given <user> logs into Vh-Admin website 
	And user is on dashboard page 
	When user attempts to sign out of the website
	Then user should be navigated to sign in screen
	Examples: 
	| user                      |
	| Case Admin                |
	| VhOfficerCivilMoneyclaims |

@VIH-2072 @logout
Scenario Outline: Case Admin When signs out half way through booking a hearing from a (Screen) Then the correct warning message is displayed
	Given Case Admin logs into the website 
	And user is in the process of <Booking> Hearing
	When user attempts to sign out of the website
	Then warning message should be displayed as You will lose all your booking details if you sign out.
	Examples: 
	| Booking           |
	| Hearing details   |
	| Assign judge      |
	| Add participants  |
	| Other information |
	| Summary           |

@VIH-2072 @logout
Scenario Outline: Vh Officer When signs out half way through booking a hearing at (Screen) Then the correct warning message is displayed
	Given Civil Money Claims, VH Officer logs in to the website 
	And user is in the process of <Booking> Hearing
	When user attempts to sign out of the website
	Then warning message should be displayed as You will lose all your booking details if you sign out.
	Examples: 
	| Booking           |
	| Hearing details   |
	| Assign judge      |
	| Add participants  |
	| Other information |
	| Summary           |

@VIH-2072 @logout
Scenario Outline: Case Admin When navigates away from booking at (Screen) Then the correct warning message is displayed
	Given Case Admin logs into the website 
	When user tries to navigate away from <booking> a hearing
	Then warning message should be displayed as Are you sure you want to discard them?
	Examples: 
	| booking                     |
	| Dashboard                   |
	| Bookings List               |