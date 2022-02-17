Feature: QuickLinks
	As a VH-Officer
	I need to be able to check that the information is correct before I submit the form
	So that I can reduce the chances of mistakes on the booking

	
@Smoketest @Smoketest-Extended
Scenario: VHO Books Hearing Without Any Participants Except The Judge
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user does not add participants and is on the Video Access Points page
	Then the user is on the Video Access Points page
	
@Smoketest @Smoketest-Extended
Scenario: VHO Confirms Booking Without Any Participants Except The Judge
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user does not add participants and is on the Video Access Points page
	And the user completes the Video access points form
	And the user completes the other information form
	And the user views the information on the summary form
	And the user views the booking details after seeing the successful booking message
	Then the hearing is available in video web
	And the conference details match the hearing	

Scenario: VHO Removes The Only Participant In The List
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user adds an Individual
	And the user is on the Video Access Points page
	And the user completes the Video access points form
	And the user completes the other information form
	And the user removes Individual
	Then the user views the information on the summary form

Scenario: VHO Removes One Participant From The List Of Many Participants
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form
	And the user is on the Video Access Points page
	And the user completes the Video access points form
	And the user completes the other information form
	And the user removes Individual
	Then the user views the information on the summary form