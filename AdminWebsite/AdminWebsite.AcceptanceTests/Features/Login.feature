Feature: Case Admin and VH Officer Accessing VH-Admin Web
	As a Case Admin/VH Officer
	I would like to login to VH-Admin Web
	So that I can book a hearing/view Questionnaire results

@smoketest
Scenario: Case admin logs in to Vh-admin web
	When Case Admin logs in with valid credentials
	Then Book a video hearing panel is displayed

@smoketest
Scenario: VH Officer logs in to Vh-admin web
	When VH Officer logs in with valid credentials 
	Then Book a video hearing panel is displayed 
	And Questionnaire results panel is displayed

@smoketest
Scenario: Non-Admin user logs in to Vh-admin web
	When Non-Admin logs in with valid credentials
	Then Error message is displayed as You are not authorised to use this service 