Feature: Add Participants
		As a Case Admin
		I need to be able to add generic details for a participant
		So that these participant details are assigned to the hearing booking when it is created

@VIH-3883
Scenario Outline: Civil Money Claims users add new participants to booking
	Given Civil Money Claims, <User> logs in to the website
	And <User> is on add the participants page
	When the admin adds parties with new users
	Then Participant details are displayed in the list
	Examples:
	| User		 |
	| VH Officer |
	| Case Admin |

@VIH-3883
Scenario Outline: Civil Money Claims users add existing participants to booking
	Given Civil Money Claims, <User> logs in to the website
	And <User> is on add the participants page
	When the admin adds parties with existing users
	Then Participant details are displayed in the list
	Examples:
	| User		 |
	| VH Officer |
	| Case Admin |

@VIH-3883
Scenario Outline: Financial Remedy users add new participants to booking
	Given Financial Remedy, <User> logs in to the website
	And <User> is on add the participants page
	When the admin adds parties with new users
	Then Participant details are displayed in the list
	Examples:
	| User		 |
	| VH Officer |
	| Case Admin |

@VIH-3883
Scenario Outline: Financial Remedy users add existing participants to booking
	Given Financial Remedy, <User> logs in to the website
	And <User> is on add the participants page
	When the admin adds parties with existing users
	Then Participant details are displayed in the list
	Examples:
	| User		 |
	| VH Officer |
	| Case Admin |

@VIH-3883
Scenario: Case Admin clears participant details
	Given Case Admin is on the add participants page
    And the admin adds parties with existing users
	When the user follows the clear details call to action
	Then add participant form values should be cleared
