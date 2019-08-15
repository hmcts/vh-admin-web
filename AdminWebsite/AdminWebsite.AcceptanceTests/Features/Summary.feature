Feature: Summary
		As a Case Admin
		I want to view a summary of the hearing details
		So that I can check the details before making the booking
		
@VIH-2317
Scenario: Case Admin edits hearing schedule
	Given Case Admin is on the Summary page
	When user navigates to hearing schedule page to make changes
	And hearing schedule is updated
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page

@VIH-2317
Scenario: Case Admin updates more information
	Given Case Admin is on the Summary page
	When user navigates to more information page to make changes
	And more information detail is updated 
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page

@VIH-2317 
Scenario: Case Admin changes judge
	Given Case Admin is on the Summary page
	When user navigates to add judge page to make changes
	And hearing booking is assigned to a different judge
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page

@smoketest
Scenario: VH Officer removes participant
	Given VH Officer is on the Summary page
	When user removes participant on the summary page
	Then participant should be removed from the list 

Scenario: Case Admin attempts to remove participant
	Given Case Admin is on the Summary page
	When user removes participant on the summary page
	And user cancels the process of removing participant
	Then participant should still be in the list 

@smoketest
Scenario: Case Admin updates participant details
	Given Case Admin is on the Summary page
	When user navigates to add participants page to make changes
	And participant details are updated 
	And user proceeds to the summary page 
	Then values should be displayed as expected on the summary page

@bug
Scenario: Case Admin attempts to update hearing details
	Given Case Admin is on the Summary page
	When user navigates to hearing details page to make changes
	And hearing booking detail is updated
	And user discards changes
	Then inputted values should not be saved 