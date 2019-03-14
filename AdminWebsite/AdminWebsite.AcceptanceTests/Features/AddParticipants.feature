Feature: Case Admin adds generic participant details to booking 
		As a Case Admin
		I need to be able to add generic details for a participant
		So that these participant details are assigned to the hearing booking when it is created

		@VIH-3883 @#001WIP
	Scenario: Case Admin 
		Given Admin user is on microsoft login page
		And CaseAdminFinRemedyCivilMoneyClaims logs into Vh-Admin website 
		And user selects hearing type as Civil Money Claims  
		 