Feature: Add Participants
	As a VH-Officer
	I need to be able to assign a courtroom account to a hearing
	So that a judge is assigned the hearing

Scenario: Add Participants
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form
	Then the user is on the Video Access Points page

@Smoketest-Extended
Scenario: Edit New Participant
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits a new participant
	Then the participant details are updated

@VIH-4194
Scenario: Cannot Add Participants with reform email address
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user attempts to add a participant with a reform email
	Then an error message is displayed for the invalid email

Scenario: Add Participant as Interpreter
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form with an Interpreter
	And the user has progressed to the Summary page
	Then the user views the information on the summary form
	
@VIH-6938
Scenario: Adding Interpreter sets and disables audio recording option
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form with an Interpreter
	And the user has progressed to the Other Information page
	Then audio recording is selected by default with options disabled

Scenario: Adding participant sets and enables audio recording  option
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form
	And the user has progressed to the Other Information page
	Then audio recording is selected by default with options enabled

Scenario: Edit Audio Recording option
	Given the Video Hearings Officer user has progressed to the Other information page
	When the user sets audio recording to No
	Then audio recording is set to No

Scenario: Removing Participant and Interpreter
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form with an Interpreter And Litigant In Person
	And the user has progressed to the Summary page
	And the user removes participant
	Then the user views the information on the summary form

Scenario: Removing Interpreter
	Given the Video Hearings Officer user has progressed to the Add Participants page
	When the user completes the add participants form with an Interpreter
	And the user has progressed to the Summary page
	And the user removes Interpreter
	Then the user views the information on the summary form

Scenario: Edit Interpreter
	Given the Video Hearings Officer user has progressed to the Add Participants page
	And the user completes the add participants form with an Interpreter
	And the user has progressed to the Booking Confirmation page
	When the user edits booking and adds a Litigant in person 
	And the user edits an Interpreter
	And the user has progressed to the summary page
	Then the user views the information on the summary form
