import { SearchService } from './search.service';
import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';
import { BHClient, JudgeResponse, PersonResponse } from './clients/api-client';
import { ParticipantModel } from '../common/model/participant.model';

let service: SearchService;

const roleRegular = 'Appelant';
const roleJudiciary = 'Panel Member';
const roleJudge = 'Judge';

const validSearchTerms = 'abc';
const invalidSearchTerms = 'ab';

const personList: PersonResponse[] = JSON.parse(
    `
    [
      {
        "id": 1,
        "contact_email": "vb.email1@hmcts.net",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "photelephone_numberne": "1111222222",
        "username": "vb.email1@hmcts.net"
      },
      {
        "id": 2,
        "contact_email": "vb.email2@hmcts.net",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "telephone_number": "1111222222",
        "username": "vb.email2@hmcts.net"
      }
    ]
    `
);


const judiciaryPerson1 = new PersonResponse();
judiciaryPerson1.first_name = 'JudiciaryPerson1Name';
judiciaryPerson1.last_name = 'JudiciaryPerson1LastName';
judiciaryPerson1.contact_email = 'JudiciaryPerson1ContactEmail';

const judiciaryPerson2 = new PersonResponse();
judiciaryPerson2.first_name = 'JudiciaryPerson2Name';
judiciaryPerson2.last_name = 'JudiciaryPerson2LastName';
judiciaryPerson2.contact_email = 'JudiciaryPerson2ContactEmail';


const judiciaryPersonList: PersonResponse[] = [
    judiciaryPerson1,
    judiciaryPerson2
];

const judge1 = new JudgeResponse();
judge1.first_name = 'JudgeFirstName1';
judge1.last_name = 'JudgeLastName1';
judge1.display_name = 'JudgeDisplayName1';
judge1.email = 'JudgeEmail1';

const judge2 = new JudgeResponse();
judge2.first_name = 'JudgeFirstName2';
judge2.last_name = 'JudgeLastName2';
judge2.display_name = 'JudgeDisplayName2';
judge2.email = 'JudgeEmail2';


const judgeList: JudgeResponse[] = [
    judge1,
    judge2
];


const judgeParticipant1 = new ParticipantModel();
judgeParticipant1.first_name = 'judgeParticipant1FirstName';
judgeParticipant1.last_name = 'judgeParticipant1LastName';
judgeParticipant1.display_name = 'judgeParticipant1DisplayName';
judgeParticipant1.email = 'judgeParticipant1Email';

const judgeParticipant2 = new ParticipantModel();
judgeParticipant2.first_name = 'judgeParticipant2FirstName';
judgeParticipant2.last_name = 'judgeParticipant2LastName';
judgeParticipant2.display_name = 'judgeParticipant2DisplayName';
judgeParticipant2.email = 'judgeParticipant2Email';

const judgeParticipantList: ParticipantModel[] = [
    judgeParticipant1,
    judgeParticipant2
];

const participant1 = new ParticipantModel();
participant1.first_name = 'participant1FirstName';
participant1.last_name = 'participant1LastName';
participant1.display_name = 'participant1DisplayName';
participant1.email = 'participant1Email';

const participant2 = new ParticipantModel();
participant2.first_name = 'participant2FirstName';
participant2.last_name = 'participant2LastName';
participant2.display_name = 'participant2DisplayName';
participant2.email = 'participant2Email';

const participantList: ParticipantModel[] = [
    participant1,
    participant2
];

let clientApiSpy: jasmine.SpyObj<BHClient>;

describe('SearchService', () => {
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>('BHClient', ['postPersonBySearchTerm', 'postJudiciaryPersonBySearchTerm', 'postJudgesBySearchTerm']);
        
        clientApiSpy.postPersonBySearchTerm.and.returnValue(of(personList));
        clientApiSpy.postJudiciaryPersonBySearchTerm.and.returnValue(of(judiciaryPersonList));
        clientApiSpy.postJudgesBySearchTerm.and.returnValue(of(judgeList));

        spyOn(ParticipantModel, 'fromPersonResponse').and.returnValue(participant1);
        spyOn(ParticipantModel, 'fromJudgeResponse').and.returnValue(judgeParticipant1);

        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [
                { provide: BHClient, useValue: clientApiSpy },
            ]
        });

        service = TestBed.inject(SearchService);
    });

    describe('participantSearch', () => {
        beforeEach(() => {
            clientApiSpy = jasmine.createSpyObj<BHClient>('BHClient', ['postPersonBySearchTerm', 'postJudiciaryPersonBySearchTerm', 'postJudgesBySearchTerm']);

            spyOn(service, 'searchEntries').and.returnValue(of(personList));
            spyOn(service, 'searchJudiciaryEntries').and.returnValue(of(judiciaryPersonList));
            spyOn(service, 'searchJudgeAccounts').and.returnValue(of(judgeList));
        });

        it('should call searchEntries and map response when role is not judge or judiciary ', () => {
            const terms = validSearchTerms;
            service.participantSearch(terms, roleRegular).subscribe(participants => {
                expect(participants.length).toEqual(participantList.length);
            });
            expect(service.searchEntries).toHaveBeenCalledWith(terms);
            expect(service.searchEntries).toHaveBeenCalledTimes(1);

            expect(service.searchJudiciaryEntries).toHaveBeenCalledTimes(0);
            expect(service.searchJudgeAccounts).toHaveBeenCalledTimes(0);

            expect(ParticipantModel.fromPersonResponse).toHaveBeenCalledTimes(personList.length);
            personList.forEach(person => {
                expect(ParticipantModel.fromPersonResponse).toHaveBeenCalledWith(person);
            });
        });

        it('should call participantSearch and map response when role is judiciary ', () => {
            const terms = validSearchTerms;
            service.participantSearch(terms, roleJudiciary).subscribe(participants => {
                expect(participants.length).toEqual(participantList.length);
            });
            expect(service.searchJudiciaryEntries).toHaveBeenCalledWith(terms);
            expect(service.searchJudiciaryEntries).toHaveBeenCalledTimes(1);

            expect(service.searchEntries).toHaveBeenCalledTimes(0);
            expect(service.searchJudgeAccounts).toHaveBeenCalledTimes(0);

            expect(ParticipantModel.fromPersonResponse).toHaveBeenCalledTimes(judiciaryPersonList.length);
            judiciaryPersonList.forEach(person => {
                expect(ParticipantModel.fromPersonResponse).toHaveBeenCalledWith(person);
            });
        });

        it('should call searchJudgeAccounts and map response when role is judge ', () => {
            const terms = validSearchTerms;

            service.participantSearch(terms, roleJudge).subscribe(participants => {
                expect(participants.length).toEqual(judgeParticipantList.length);
            });
            expect(service.searchJudgeAccounts).toHaveBeenCalledWith(terms);
            expect(service.searchJudgeAccounts).toHaveBeenCalledTimes(1);

            expect(service.searchEntries).toHaveBeenCalledTimes(0);
            expect(service.searchJudiciaryEntries).toHaveBeenCalledTimes(0);

            expect(ParticipantModel.fromJudgeResponse).toHaveBeenCalledTimes(judgeList.length);
            judgeList.forEach(judge => {
                expect(ParticipantModel.fromJudgeResponse).toHaveBeenCalledWith(judge);
            });
        });
    });

    describe('searchEntries', () => {
        it('should method searchEntries not call api and return empty array when term is invalid', () => {
            const terms = invalidSearchTerms;
            service.searchEntries(terms).subscribe(x => expect(x.length).toBe(0));
        });
        it('should method searchEntries call api and return persons response array when term is valid', () => {
            const terms = validSearchTerms;
            service.searchEntries(terms).subscribe(x => expect(x).toBe(personList));
        });
    });

    describe('searchJudiciaryEntries', () => {
        it('should method searchEntries not call api and return empty array when term is invalid', () => {
            const terms = invalidSearchTerms;
            service.searchJudiciaryEntries(terms).subscribe(x => expect(x.length).toBe(0));
        });
        it('should method searchEntries call api and return persons response array when term is valid', () => {
            const terms = validSearchTerms;
            service.searchJudiciaryEntries(terms).subscribe(x => expect(x).toBe(judiciaryPersonList));
        });
    });

    describe('searchJudgeAccounts', () => {
        it('should method searchEntries not call api and return empty array when term is invalid', () => {
            const terms = invalidSearchTerms;
            service.searchJudgeAccounts(terms).subscribe(x => expect(x.length).toBe(0));
        });
        it('should method searchEntries call api and return persons response array when term is valid', () => {
            const terms = validSearchTerms;
            service.searchJudgeAccounts(terms).subscribe(x => expect(x).toBe(judgeList));
        });
    });

    it('should return title list', () => {
        const list = service.TitleList;
        expect(list).toBeTruthy();
        expect(list.length).toBeGreaterThan(0);
    });
});
