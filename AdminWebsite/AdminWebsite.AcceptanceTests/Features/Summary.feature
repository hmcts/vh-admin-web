Feature: Case Admin views booking summary screen
		As a Case Admin
		I want to view a summary of the hearing details
		So that I can check the details before making the booking

@VIH-2317
Scenario: Case Admin edits hearing details 
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user navigates to hearing details page to make changes 
	And hearing booking detail is updated
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
		
@VIH-2317
Scenario: Case Admin edits hearing schedule
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user navigates to hearing schedule page to make changes
	And hearing schedule is updated
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page

@VIH-2317
Scenario: Case Admin updates more information
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user navigates to more information page to make changes
	And more information detail is updated 
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page

@VIH-2317 
Scenario: Case Admin changes judge
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user navigates to add judge page to make changes
	And hearing booking is assigned to a different judge
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page
	
Scenario: Case Admin removes particpant
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user removes participant on summary page
	Then participant should be removed from the list 

Scenario: Case Admin attempts to remove particpant
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user removes participant on summary page
	And user cancels the process of removing participant
	Then participant should still be in the list 
	
@smoketest
Scenario: Case Admin updates particpant details
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user navigates to add participants page to make changes
	And paticipant detail is updated  
	And user proceeds to summary page 
	Then inputted values should be displayed as expected on summary page

@smoketest
Scenario: Case Admin attempts to update hearing details
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user navigates to hearing details page to make changes
	And hearing booking detail is updated
	And user cancels the update  
	Then inputted values should not be saved 