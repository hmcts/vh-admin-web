Feature: Case Admin adds Other information to booking hearing
		As a Case Admin
		I want to be able to add any other information to the Video Hearing booking
		So that any other details that might be relevant to the booking can be included

@VIH-2641
Scenario: Case Admin adds Other information to the Video Hearing booking
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on other information page 
	When user adds other information to the Video Hearing booking  
	And user proceeds to next page 
	Then user should be on summary page 