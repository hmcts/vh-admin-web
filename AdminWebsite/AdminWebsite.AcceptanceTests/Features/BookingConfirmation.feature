Feature: Case Admin saves booking and views confirmation screen 
As a Case Admin
I want to confirm the booking and see a confirmation of the booking
So that the hearing can take place on the time and date specified

@smoketest @VIH-2701
Scenario: Case Admin saves booking and views confirmation screen
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on Summary page
	When user submit booking 
	Then hearing should be booked

@VIH-2701
Scenario Outline: Case Admin with multiple case types saves booking
	Given Admin user is on microsoft login page
	And CaseAdminFinRemedyCivilMoneyClaims logs into Vh-Admin website 
	And user is on hearing details page
	And user selects <Case Type> 
	And user adds hearing schedule
	And user proceeds to next page 
	And hearing booking is assigned to a judge
	And user proceeds to next page 
	When user selects <Party>
	And use adds participant
	And user proceeds to next page
	And user adds other information to the Video Hearing booking
	And user proceeds to next page
	And Admin user is on summary page
	And user submit booking 
	Then hearing should be booked
Examples:
| Case Type          | Party      |
| Civil Money Claims | Claimant   |
| Civil Money Claims | Defendant  |
| Financial Remedy   | Applicant  |
| Financial Remedy   | Respondent |	 