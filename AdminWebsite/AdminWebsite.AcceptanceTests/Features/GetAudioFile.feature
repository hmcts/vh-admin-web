Feature: Get Audio File
	In order to be able to retrieve audio recordings of hearings
	As a Video Hearings Officier
	I want to be able to search for audio recordings

@VIH-5331 @Smoketest-Extended @AudioRecording
Scenario: Get Audio File
	Given I have an audio recording for the closed conference
	And the Video Hearings Officer user has progressed to the Get Audio File page
	When I search for the audio recording by case number
	Then the audio recording is retrieved
	And the link can be retrieved

#VIH-7984
@Smoketest-Extended @AudioRecording
Scenario: Get Audio File For Main Hearing Room And Interpreter
	Given I have an audio recording for the closed conference with an Interpreter
	And the Video Hearings Officer user has progressed to the Get Audio File page
	When I search for the audio recording by case number
	Then the audio recording is retrieved
	And the links can be retrieved