Feature: VH Officer/Case Admin Booking details
As a VH Officer/Case Admin
I want to view or amend the details of a video hearing booking
So that I can ensure any changes in details can be reflected in the VH system

@smoketest @VIH-3461
Scenario: Case Admin views booking details
	Given hearing is booked by Case Admin
	When admin user returns to dashboard  
	Then admin user can view booking list
	And expected details should be populated

@smoketest @VIH-3461
Scenario: Vh Officer views booking details
	Given hearing is booked by VhOfficerCivilMoneyclaims
	When admin user returns to dashboard  
	Then admin user can view booking list
	And expected details should be populated

@smoketest @VIH-3743
Scenario: Admin officer changes judge
	Given Case Admin tries to amend booking
	When user navigates to add judge page to make changes
	And hearing booking is assigned to a different judge
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved

 @VIH-3743
Scenario: Participant is removed from booked hearing
	Given Case Admin tries to amend booking
	When user removes participant on summary page
	Then participant should be removed from the list 

 @smoketest @VIH-3743          
Scenario: Case Admin amends participant details
	Given Case Admin tries to amend booking
	When user navigates to add participants page to make changes
	And participant details is updated 
	And user proceeds to summary page
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved

@VIH-3743
Scenario: Admin amends hearing details
	Given Case Admin tries to amend booking
	When user navigates to hearing details page to make changes	
	And Case Admin updates hearing booking details
	And user proceeds to summary page
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved

@VIH-3743
Scenario: Case Admin amends more information
	Given Case Admin tries to amend booking
	When user navigates to more information page to make changes
	And more information detail is updated 
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved

@VIH-3743 @bug
Scenario: Case Admin amends hearing schedule
	Given Case Admin tries to amend booking
	When user navigates to hearing schedule page to make changes
	And hearing schedule is updated
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	And amended values should be saved