Feature: Case Admin or VH Officer enters VH schedule & location details
	As a person who books a video hearing (e.g. Case Admin or VH Officer)
	I want to be presented with an appropriate form for schedule & location details
	So that I am able to enter time, date and location of the video hearing I am requesting

@VIH-2619 @smoketest
Scenario: Case Admin enters time date and location of the video hearing
	Given Case Admin is on hearing schedule page
	When user enters video hearing schedule details 
	And user proceeds to next page 
	Then user should be on assign judge page

@VIH-2619 @Bug-VIH-4126
Scenario: User to proceed until a valid date is entered
	Given Case Admin is on hearing schedule page
	When user inputs a date in the past from the calendar 
	And user proceeds to next page
	Then an error message should be displayed as Please enter a date in the future
	And user should remain on hearing schedule page 