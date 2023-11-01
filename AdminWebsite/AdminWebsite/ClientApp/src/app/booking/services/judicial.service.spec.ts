import { JudicialService } from './judicial.service';
import { of } from 'rxjs';
import { BHClient, JudiciaryPerson } from 'src/app/services/clients/api-client';

describe('JudicialService', () => {
    let service: JudicialService;
    let bhClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        bhClientSpy = jasmine.createSpyObj('BHClient', ['searchForJudiciaryPerson']);
        service = new JudicialService(bhClientSpy);
    });

    describe('getJudicialUsers', () => {
        it('should return an array of JudiciaryPerson objects with work_phone set to "01234567890"', () => {
            const searchText = 'test';
            const expectedJudicialUsers: JudiciaryPerson[] = [
                new JudiciaryPerson({ personal_code: '1', full_name: 'John Doe', work_phone: '01234567890' }),
                new JudiciaryPerson({ personal_code: '2', full_name: 'Jane Doe', work_phone: '01234567890' })
            ];
            bhClientSpy.searchForJudiciaryPerson.and.returnValue(of(expectedJudicialUsers));

            service.getJudicialUsers(searchText).subscribe(judicialUsers => {
                expect(judicialUsers).toEqual(expectedJudicialUsers);
                expect(bhClientSpy.searchForJudiciaryPerson).toHaveBeenCalledWith(searchText);
            });
        });
    });
});
