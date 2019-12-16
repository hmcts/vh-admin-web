Feature: Error Pages
	As a registered video hearings user
	I would expect information error messages when things go wrong
	So that I know how to resolve the issue

@UnsupportedBrowser
Scenario: Unsupported browser error page
	Given a new browser is open for a Video Hearings Officer
	When the user attempts to access the page on their unsupported browser
	Then the user is on the Unsupported Browser error page with text of how to rectify the problem
