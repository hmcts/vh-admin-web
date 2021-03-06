﻿Feature: Other Information
	As a VH-Officer
	I need to be able to add other information to a hearing
	So that I can keep a note of any extra hearing information

Scenario: Other Information
	Given the Video Hearings Officer user has progressed to the Other Information page
	When the user completes the other information form
	Then the user is on the Summary page

@Smoketest-Extended
Scenario: Edit Other Information
	Given the Video Hearings Officer user has progressed to the Booking Details page
	When the user edits the other information
	Then the details are updated