import { BookingsListModel, BookingsDetailsModel } from './../common/model/bookings-list.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { BookingPersistService } from './bookings-persist.service';
import { v4 as uuid } from 'uuid';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';
import { JudicialMemberDto } from '../booking/judicial-office-holders/models/add-judicial-member.model';

function MockGroupedBookings(hearings: BookingsDetailsModel[]): BookingsListModel {
    const model = new BookingsListModel(new Date());
    model.BookingsDetails = hearings;
    return model;
}

function MockBookedHearing(): BookingsDetailsModel {
    return new BookingsDetailsModel(
        uuid(),
        new Date(),
        45,
        'CaseNo',
        'CaseName',
        'Financial Remedy',
        'Judge Dredd',
        'Manchester Room 1',
        'Manchester Civil Court',
        'created.by@hmcts.net',
        new Date(),
        'last.edit@hmcts.net',
        new Date(),
        'last.confirmed@hmcts.net',
        new Date(),
        'booked',
        true,
        'reason',
        'Financial Remedy',
        '',
        ''
    );
}

describe('BookingsPersistService', () => {
    let service: BookingPersistService;

    beforeEach(() => {
        service = new BookingPersistService();
    });

    describe('#updateBooking', () => {
        it('should not update if there are no loaded hearings', () => {
            const model: HearingModel = {
                updated_date: new Date(),
                audio_recording_required: true
            };
            service.updateBooking(model);
            expect(service.bookingList.length).toBe(0);
        });

        it('should not update hearing if it is not selected', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            const hearing = new HearingModel();
            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.cases = [updatedCase];
            hearing.hearing_id = service.bookingList[0].BookingsDetails[0].HearingId;
            service.updateBooking(hearing);

            expect(service.bookingList[0].BookingsDetails[0].HearingCaseName).not.toBe(updatedCase.name);
        });

        it('should update all hearing model values for selected hearing', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = new HearingModel();
            hearing.court_id = 1;
            hearing.court_room = 'court room';
            hearing.court_name = 'court';

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.cases = [updatedCase];

            hearing.hearing_id = service.bookingList[0].BookingsDetails[0].HearingId;
            service.updateBooking(hearing);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.HearingCaseName).toBe(updatedCase.name);
        });

        it('should update judge name for selected hearing', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = new HearingModel();
            hearing.court_id = 1;
            hearing.court_room = 'court room';
            hearing.court_name = 'court';
            const participants: ParticipantModel[] = [];
            const judge = new ParticipantModel({ is_judge: true, display_name: 'Judge Test' });
            participants.push(judge);
            hearing.participants = participants;

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.cases = [updatedCase];

            hearing.hearing_id = service.bookingList[0].BookingsDetails[0].HearingId;
            service.updateBooking(hearing);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.JudgeName).toBe(judge.display_name);
        });

        it('should update judge name for selected hearing with judiciary participant judge', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = new HearingModel();
            hearing.court_id = 1;
            hearing.court_room = 'court room';
            hearing.court_name = 'court';
            const judiciaryParticipants: JudicialMemberDto[] = [];
            const judge = new JudicialMemberDto('Judge', 'One', 'Judge One', 'email', 'telephone', 'personalCode');
            judge.displayName = 'Judge Test';
            judge.roleCode = 'Judge';
            judiciaryParticipants.push(judge);
            hearing.judiciaryParticipants = judiciaryParticipants;

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.cases = [updatedCase];

            hearing.hearing_id = service.bookingList[0].BookingsDetails[0].HearingId;
            service.updateBooking(hearing);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.JudgeName).toBe(judge.displayName);
        });

        it('should update judge name for selected hearing with judiciary participants but no judge', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = new HearingModel();
            hearing.court_id = 1;
            hearing.court_room = 'court room';
            hearing.court_name = 'court';
            const judiciaryParticipants: JudicialMemberDto[] = [];
            const participant = new JudicialMemberDto('Panel', 'Member', 'Panel Member', 'email', 'telephone', 'personalCode');
            participant.displayName = 'Panel Member';
            participant.roleCode = 'PanelMember';
            judiciaryParticipants.push(participant);
            hearing.judiciaryParticipants = judiciaryParticipants;

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.cases = [updatedCase];

            hearing.hearing_id = service.bookingList[0].BookingsDetails[0].HearingId;
            service.updateBooking(hearing);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.JudgeName).toBe('');
        });
    });

    describe('#resetAll', () => {
        it('should reset selection', () => {
            const aHearingId = uuid();
            service.selectedGroupIndex = 1;
            service.selectedItemIndex = 1;
            service.selectedHearingId = aHearingId;

            service.resetAll();

            expect(service.selectedGroupIndex).not.toBe(1);
            expect(service.selectedItemIndex).not.toBe(1);
            expect(service.selectedHearingId).not.toBe(aHearingId);
        });

        it('should reset list of hearings', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing()])];
            service.resetAll();
            expect(service.bookingList.length).toBe(0);
        });
    });

    describe('#startDate', () => {
        it('should set startDate for date value', () => {
            service.startDate = new Date(2022, 3, 30);
            expect(service.startDate).toEqual(new Date(2022, 3, 30));
        });

        it('should handle null startDate', () => {
            service.startDate = null;
            expect(service.startDate).toBeNull();
        });
    });

    describe('#endDate', () => {
        it('should set endDate for date value', () => {
            service.endDate = new Date(2022, 3, 30);
            expect(service.endDate).toEqual(new Date(2022, 3, 30));
        });

        it('should handle null endDate', () => {
            service.endDate = null;
            expect(service.endDate).toBeNull();
        });
    });

    describe('#noAllocated', () => {
        it('should set noAllocatedHearings', () => {
            service.noAllocatedHearings = true;
            expect(service.noAllocatedHearings).toEqual(true);
        });

        it('should handle false noAllocatedHearings', () => {
            service.noAllocatedHearings = false;
            expect(service.noAllocatedHearings).toBeFalsy();
        });
    });

    describe('#selectedUsers', () => {
        it('should set selectedUsers', () => {
            service.selectedUsers = ['guid1', 'guid2'];
            expect(service.selectedUsers.length).toBe(2);
        });

        it('should handle empty selectedUsers', () => {
            service.selectedUsers = [];
            expect(service.selectedUsers).toEqual([]);
        });
    });

    describe('#showSearch', () => {
        it('should set showSearch when false', () => {
            const showSearch = false;
            service.showSearch = showSearch;
            expect(service.showSearch).toBe(showSearch);
        });

        it('should set showSearch when true', () => {
            const showSearch = true;
            service.showSearch = showSearch;
            expect(service.showSearch).toBe(showSearch);
        });
    });
});
