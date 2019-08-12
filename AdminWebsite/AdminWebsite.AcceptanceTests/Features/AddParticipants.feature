Feature: Add Participants
		As a Case Admin
		I need to be able to add generic details for a participant
		So that these participant details are assigned to the hearing booking when it is created

@VIH-3883 @smoketest
Scenario Outline: Add participant details to booking
	Given 'VH Officer' with multiple <CaseTypes> wants to add a <Party> to booking 
	When admin adds participant details
	Then Participant detail is displayed on the list
	Examples:
	| CaseTypes          | Party      |
	| Civil Money Claims | Claimant   |

@VIH-3883
Scenario: Case Admin clears participant details
	Given Case Admin is on add participants page
	When user clears inputted values 
	Then all values should be cleared from the fields 