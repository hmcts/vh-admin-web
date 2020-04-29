Feature: Questionnaire
	In order to view submitted questionnaire answers
	As a Video Hearings Offiver
	I want to have access to those answers

@Smoketest-Extended
Scenario: Questionnaire Individual
	Given there is a hearing where an Individual participant has completed some questionnaire answers
	And the Video Hearings Officer user has progressed to the Questionnaire page
	Then the user can see a list of answers including the Individual specific answer

@Smoketest-Extended
Scenario: Questionnaire Representative
	Given there is a hearing where an Representative participant has completed some questionnaire answers
	And the Video Hearings Officer user has progressed to the Questionnaire page
	Then the user can see a list of answers including the Representative specific answer
