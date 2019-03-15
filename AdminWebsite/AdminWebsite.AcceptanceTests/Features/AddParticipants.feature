Feature: Case Admin adds generic participant details to booking 
		As a Case Admin
		I need to be able to add generic details for a participant
		So that these participant details are assigned to the hearing booking when it is created

@VIH-3883 
Scenario Outline: Case Admin adds participant details to booking
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
	Then Participant detail is displayed on the list
Examples:
| Case Type          | Party      |
| Civil Money Claims | Claimant   |
| Civil Money Claims | Defendant  |
| Financial Remedy   | Applicant  |
| Financial Remedy   | Respondent |	 

@VIH-3883
Scenario: Case Admin clears participant details
	Given Admin user is on microsoft login page
	And Case Admin logs into Vh-Admin website 
	And user is on add participants page
	When user clears inputted values 
	Then all values should be cleared from the fields 