Feature: Booking details
As a VH Officer/Case Admin
I want to view or amend the details of a video hearing booking
So that I can ensure any changes in details can be reflected in the VH system

@VIH-3461
Scenario: Case Admin views booking details
	Given hearing is booked by Case Admin
	When admin user returns to the dashboard  
	Then admin user can view the booking list
	And expected details should be populated

@VIH-3461
Scenario: Vh Officer views booking details
	Given hearing is booked by VH Officer
	When admin user returns to the dashboard  
	Then admin user can view the booking list
	And expected details should be populated

@VIH-3743
Scenario: Admin officer changes judge
	Given Case Admin amends booking
	When user navigates to add judge page to make changes
	And hearing booking is assigned to a different judge
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page
	And amended values should be saved

 @VIH-3743
Scenario: Participant is removed from booked hearing
	Given Case Admin amends booking
	When user removes participant on the summary page
	Then participant should be removed from the list 

@VIH-3743          
Scenario: Case Admin amends participant details
	Given Case Admin amends booking
	When user navigates to add participants page to make changes
	And participant details are updated 
	And user proceeds to the summary page
	Then values should be displayed as expected on the summary page
	And amended values should be saved

@VIH-3743
Scenario: Admin amends hearing details
	Given Case Admin amends booking
	When user navigates to hearing details page to make changes	
	And Case Admin updates hearing booking details
	And user proceeds to the summary page
	Then values should be displayed as expected on the summary page
	And amended values should be saved

@VIH-3743
Scenario: Case Admin amends more information
	Given Case Admin amends booking
	When user navigates to more information page to make changes
	And more information detail is updated 
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page
	And amended values should be saved

@VIH-3743 @bug
Scenario: Case Admin amends hearing schedule
	Given Case Admin amends booking
	When user navigates to hearing schedule page to make changes
	And hearing schedule is updated to 02:30
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page
	And amended values should be saved

@VIH-3731
Scenario Outline: Admin cancels a video hearing booking
	Given <Admin> is on booking details page
	When the admin cancels hearing
	Then cancelled label should be shown on booking details page
	And booking details page should be displayed without the Edit or Cancel buttons
Examples:
| Admin                     |
| Case Admin                |
| VhOfficerCivilMoneyclaims |

@VIH-3996
Scenario: Case Admin amends existing hearing with an existing participant
	Given Case Admin amends booking
	When user adds existing participant to the hearing  
	Then values should be displayed as expected on the summary page
	And values should be displayed as expected on edit view