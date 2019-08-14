Feature: Booking Confirmation
As a Case Admin
I want to confirm the booking and see a confirmation of the booking
So that the hearing can take place on the time and date specified

@VIH-2701 @smoketest
Scenario: Case Admin creates hearing with an existing individual 
	Given an individual is already a participant of another hearing
	And Case Admin is on the Summary page
	When user submits the booking 
	Then hearing should be booked

@VIH-2701 @bug
Scenario Outline: Case Admin with multiple case types saves booking
	Given 'VH Officer' adds existing participants with <Party> and <Role> to booking 
	When user submits the booking 
	Then hearing should be booked
	Examples:
	| CaseTypes          | Party      | Role           |
	| Civil Money Claims | Claimant   | Claimant LIP   |
	| Civil Money Claims | Defendant  | Defendant LIP  |
	| Civil Money Claims | Defendant  | Solicitor      |
	| Financial Remedy   | Applicant  | Applicant LIP  |
	| Financial Remedy   | Respondent | Respondent LIP |
	| Financial Remedy   | Respondent | Solicitor      |