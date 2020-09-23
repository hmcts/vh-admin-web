Feature: Video Access Points
	As a VH-Officer
	I need to be able to add video access points to a hearing
	So that 0 or more video access points are assigned to the hearing

Scenario: Add a video access endpoint
	Given the Video Hearings Officer user has progressed to the Video access points page
	When the user completes the Video access points form
	Then the user is on the Other Information page

Scenario: Edit a video access endpoint
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits an endpoint display name
	Then the details are updated
