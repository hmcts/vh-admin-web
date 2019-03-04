Feature: CreateHearing

@smoketest
Scenario: Admin views hearing information on summary page
	Given Case Admin is on microsoft login page
	When Case Admin logs in with valid credentials
	And book a video hearing panel is selected
	And hearing details form is filled
	And next button is clicked
	And hearing schedule form is filled 
	And next button is clicked
	And judge is assigned to hearing 
	And next button is clicked
	And professional participant is added to hearing
	And admin adds more information 
	Then hearing summary is displayed on summary page 