Feature: Questionnaire
	In order to view submitted questionnaire answers
	As a Video Hearings Offiver
	I want to have access to those answers

Scenario: Questionnaire
	Given there is a hearing where participants have completed some questionnaire answers
	And the Video Hearings Officer user has progressed to the Questionnaire page
	Then the user can see a list of answers
