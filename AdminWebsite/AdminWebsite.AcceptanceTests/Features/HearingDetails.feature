Feature: Hearing Details
	As a Case Admin or VH-Officer
	I need to be able to add hearing details
	So that the correct information is available to all participants who are joining the hearing
	
@VIH-3582 @deprecated
Scenario: Display no dropdown on hearing details page for one case type
	Given Case Admin logs into the website 
	And user is on the hearing details page
	Then case type dropdown should not be populated

@VIH-3582 @deprecated
Scenario: Display dropdown on hearing details page for more than one case type
	Given Financial Remedy, Case Admin logs in to the website 
	And user is on the hearing details page
	Then case type dropdown should be populated
     @VIH-3582 Scenario: Do not display any case type in dropdown on hearing details page for Case Admin with only one case type Given Case Admin logs into the website  And this user has the following case types associated:     |Financial Remedy| And user is on the hearing details page Then case type dropdown should not be populated  @VIH-3582 Scenario: Display only associated case type in dropdown items on hearing details page for Case Admin with more than one case type Given Case Admin with two Case Types logs into the website And this user has the following case types associated:     |Financial Remedy|     |Civil Money Claims| And user is on the hearing details page Then associated case types should be visible in the case type dropdown  @VIH-3582 Scenario: Display all dropdown items on hearing details page for VH Officers Given VH Officer logs in to the website And user is on the hearing details page Then all case types should be visible in the case type dropdown:     |Civil Money Claims|     |Financial Remedy|     |Generic|     |Children Act|     |Tax|     |Family Law Act|     |Tribunal| 