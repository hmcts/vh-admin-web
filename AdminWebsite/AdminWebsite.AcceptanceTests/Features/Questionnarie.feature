Feature: Questionnaire
	In order to look through all the hearing bookings to find any new responses
	As a VH Officer
	I want to be able to quickly see any new participant questionnaire responses

@VIH-4460
Scenario: VH Officer views questionnaire
	Given Participants answered questionnaire 
	And VH Officer is on the dashboard page
	When VH Officer clicks on the questionnaire
	Then Expected questionnaire with answers should be populated
