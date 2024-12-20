import { SearchService } from './search.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';
import { BHClient, JudgeAccountType, JudgeResponse, PersonResponseV2 } from './clients/api-client';
import { Constants } from '../common/constants';
import { LaunchDarklyService } from './launch-darkly.service';
import { VHParticipant } from '../common/model/vh-participant';
import * as ApiContractToClientModelMappers from '../common/model/api-contract-to-client-model-mappers';

let service: SearchService;

const roleRegular = 'Appelant';
const roleJudge = 'Judge';

const validSearchTerms = 'abc';
const invalidSearchTerms = 'ab';

const personList: PersonResponseV2[] = JSON.parse(
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

const judge1 = new JudgeResponse();
judge1.first_name = 'JudgeFirstName1';
judge1.last_name = 'JudgeLastName1';
judge1.display_name = 'JudgeDisplayName1';
judge1.email = 'JudgeEmail1';
judge1.contact_email = 'JudgeEmail1';
judge1.account_type = JudgeAccountType.Courtroom;

const judge2 = new JudgeResponse();
judge2.first_name = 'JudgeFirstName2';
judge2.last_name = 'JudgeLastName2';
judge2.display_name = 'JudgeDisplayName2';
judge2.email = 'JudgeEmail2';
judge2.contact_email = 'JudgeEmail2';
judge2.account_type = JudgeAccountType.Courtroom;

const ejudJudge = new JudgeResponse();
ejudJudge.first_name = 'judgeEjud';
ejudJudge.last_name = 'judgeEjud';
ejudJudge.display_name = null;
ejudJudge.email = 'judgeEjud';
judge2.contact_email = null;
ejudJudge.account_type = JudgeAccountType.Judiciary;

const judgeList: JudgeResponse[] = [judge1, judge2, ejudJudge];

const judgeParticipant1 = new VHParticipant();
judgeParticipant1.firstName = 'judgeParticipant1FirstName';
judgeParticipant1.lastName = 'judgeParticipant1LastName';
judgeParticipant1.displayName = 'judgeParticipant1DisplayName';
judgeParticipant1.email = 'judgeParticipant1Email';

const judgeParticipant2 = new VHParticipant();
judgeParticipant2.firstName = 'judgeParticipant2FirstName';
judgeParticipant2.lastName = 'judgeParticipant2LastName';
judgeParticipant2.displayName = 'judgeParticipant2DisplayName';
judgeParticipant2.email = 'judgeParticipant2Email';

const judgeParticipant3 = new VHParticipant();
judgeParticipant2.firstName = 'judgeParticipant2FirstName';
judgeParticipant2.lastName = 'judgeParticipant2LastName';
judgeParticipant2.displayName = null;
judgeParticipant2.email = 'judgeEjud';

const judgeParticipantList: VHParticipant[] = [judgeParticipant1, judgeParticipant2, judgeParticipant3];

const participant1 = new VHParticipant();
participant1.firstName = 'participant1FirstName';
participant1.lastName = 'participant1LastName';
participant1.displayName = 'participant1DisplayName';
participant1.email = 'participant1Email';

const participant2 = new VHParticipant();
participant2.firstName = 'participant2FirstName';
participant2.lastName = 'participant2LastName';
participant2.displayName = 'participant2DisplayName';
participant2.email = 'participant2Email';
const participantList: VHParticipant[] = [participant1, participant2];
let clientApiSpy: jasmine.SpyObj<BHClient>;
const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
let mapPersonResponseToVHParticipantSpy: jasmine.Spy;
let mapJudgeResponseToVHParticipantSpy: jasmine.Spy;

describe('SearchService', () => {
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>('BHClient', ['postPersonBySearchTerm', 'postJudgesBySearchTerm']);

        clientApiSpy.postPersonBySearchTerm.and.returnValue(of(personList));
        clientApiSpy.postJudgesBySearchTerm.and.returnValue(of(judgeList));

        mapPersonResponseToVHParticipantSpy = spyOn(ApiContractToClientModelMappers, 'mapPersonResponseToVHParticipant').and.returnValue(
            participant1
        );
        mapJudgeResponseToVHParticipantSpy = spyOn(ApiContractToClientModelMappers, 'mapJudgeResponseToVHParticipant').and.returnValue(
            judgeParticipant1
        );

        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [
                { provide: BHClient, useValue: clientApiSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        });

        service = TestBed.inject(SearchService);
    });

    describe('participantSearch', () => {
        beforeEach(() => {
            clientApiSpy = jasmine.createSpyObj<BHClient>('BHClient', ['postPersonBySearchTerm', 'postJudgesBySearchTerm']);

            spyOn(service, 'searchEntries').and.returnValue(of(personList));
            spyOn(service, 'searchJudgeAccounts').and.returnValue(of(judgeList));
        });

        it('should call searchEntries and map response when role is not judge or judiciary ', () => {
            const terms = validSearchTerms;
            service.participantSearch(terms, roleRegular).subscribe(participants => {
                expect(participants.length).toEqual(participantList.length);
            });
            expect(service.searchEntries).toHaveBeenCalledWith(terms);
            expect(service.searchEntries).toHaveBeenCalledTimes(1);
            expect(service.searchJudgeAccounts).toHaveBeenCalledTimes(0);

            expect(ApiContractToClientModelMappers.mapPersonResponseToVHParticipant).toHaveBeenCalledTimes(personList.length);
            personList.forEach(person => {
                expect(ApiContractToClientModelMappers.mapPersonResponseToVHParticipant).toHaveBeenCalledWith(person);
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

            expect(mapJudgeResponseToVHParticipantSpy).toHaveBeenCalledTimes(judgeList.length);
            judgeList.forEach(judge => {
                expect(mapJudgeResponseToVHParticipantSpy).toHaveBeenCalledWith(judge);
            });
        });
    });

    describe('searchEntries', () => {
        it('should method searchEntries not call api and return empty array when term is invalid', () => {
            const terms = invalidSearchTerms;

            service.participantSearch(terms, roleRegular).subscribe(participants => {
                expect(participants.length).toBe(0);
            });
        });
        it('should method searchEntries call api and return persons response array when term is valid', () => {
            const terms = validSearchTerms;
            service.searchEntries(terms).subscribe(x => expect(x).toBe(personList));
        });
    });

    describe('searchJudgeAccounts', () => {
        it('should method searchJudgeAccounts not call api and return empty array when term is invalid', () => {
            const terms = invalidSearchTerms;
            service.participantSearch(terms, Constants.HearingRoles.Judge).subscribe(participants => {
                expect(participants.length).toBe(0);
            });
        });
        it('should method searchJudgeAccounts call api and return persons response array when term is valid', () => {
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
