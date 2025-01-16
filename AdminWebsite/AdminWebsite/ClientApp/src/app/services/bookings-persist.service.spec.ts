import { BookingsListModel } from './../common/model/bookings-list.model';
import { BookingPersistService } from './bookings-persist.service';
import { v4 as uuid } from 'uuid';
import { CaseModel } from '../common/model/case.model';
import {
    BookingStatus,
    CaseResponse,
    CaseTypeResponse,
    HearingDetailsResponse,
    JudiciaryParticipantResponse,
    VideoSupplier
} from './clients/api-client';
import { VHBooking } from '../common/model/vh-booking';
import { BookingsListItemModel } from '../common/model/booking-list-item.model';
import { mapHearingToVHBooking } from '../common/model/api-contract-to-client-model-mappers';

function MockGroupedBookings(hearings: BookingsListItemModel[]): BookingsListModel {
    const model = new BookingsListModel(new Date());
    model.BookingsDetails = hearings;
    return model;
}

function MockBookedHearing(): BookingsListItemModel {
    const hearingDetailsResponse = MockHearingDetailsResponse();
    const judiciaryParticipant = new JudiciaryParticipantResponse();
    judiciaryParticipant.display_name = 'Judge Dredd';
    judiciaryParticipant.role_code = 'Judge';
    hearingDetailsResponse.judiciary_participants = [judiciaryParticipant];

    const hearing = mapHearingToVHBooking(hearingDetailsResponse);
    const listItem = new BookingsListItemModel(hearing);
    return listItem;
}

function MockBookedHearingWithoutJudge(): BookingsListItemModel {
    const hearingDetailsResponse = MockHearingDetailsResponse();
    const judiciaryParticipant = new JudiciaryParticipantResponse();
    judiciaryParticipant.display_name = 'PM';
    judiciaryParticipant.role_code = 'Panel Member';
    hearingDetailsResponse.judiciary_participants = [judiciaryParticipant];

    const hearing = mapHearingToVHBooking(hearingDetailsResponse);
    const listItem = new BookingsListItemModel(hearing);
    return listItem;
}

function MockHearingDetailsResponse(): HearingDetailsResponse {
    const response = new HearingDetailsResponse();
    response.id = uuid();
    response.scheduled_date_time = new Date();
    response.scheduled_duration = 45;
    const caseResponse = new CaseResponse();
    caseResponse.number = 'CaseNo';
    caseResponse.name = 'CaseName';
    response.cases = [caseResponse];
    response.hearing_room_name = 'Manchester Room 1';
    response.hearing_venue_name = 'Manchester Civil Court';
    response.created_by = 'created.by@hmcts.net';
    response.created_date = new Date();
    response.status = BookingStatus.Booked;
    response.audio_recording_required = true;
    response.case_type = new CaseTypeResponse({
        name: 'Financial Remedy'
    });
    return response;
}

function MockBookedMultiDayHearing(): BookingsListItemModel[] {
    const groupId = '123';

    const day1Hearing = MockBookedHearing();
    day1Hearing.Booking.groupId = groupId;
    day1Hearing.Booking.case.name = 'Day 1 of 2';

    const day2Hearing = MockBookedHearing();
    day2Hearing.Booking.groupId = groupId;
    day2Hearing.Booking.case.name = 'Day 2 of 2';

    const hearingsInGroup = [day1Hearing.Booking, day2Hearing.Booking];
    day1Hearing.Booking.hearingsInGroup = hearingsInGroup;
    day2Hearing.Booking.hearingsInGroup = hearingsInGroup;

    return [day1Hearing, day2Hearing];
}

describe('BookingsPersistService', () => {
    let service: BookingPersistService;

    beforeEach(() => {
        service = new BookingPersistService();
    });

    describe('#updateBooking', () => {
        it('should not update if there are no loaded hearings', () => {
            const model = new VHBooking({
                updatedDate: new Date(),
                audioRecordingRequired: true,
                supplier: VideoSupplier.Vodafone
            });
            service.updateBooking(model);
            expect(service.bookingList.length).toBe(0);
        });

        it('should not update hearing if it is not selected', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            const hearing = new VHBooking();
            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.case = updatedCase;
            hearing.hearingId = service.bookingList[0].BookingsDetails[0].Booking.hearingId;
            service.updateBooking(hearing);

            expect(service.bookingList[0].BookingsDetails[0].Booking.case.name).not.toBe(updatedCase.name);
        });

        it('should update all hearing model values for selected hearing', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = new VHBooking();
            hearing.courtRoom = 'court room';
            hearing.courtName = 'court';

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.case = updatedCase;

            hearing.hearingId = service.bookingList[0].BookingsDetails[0].Booking.hearingId;
            service.updateBooking(hearing);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.Booking.case.name).toBe(updatedCase.name);
        });

        it('should update all hearing model values for selected multi-day hearing', () => {
            const multiDays = MockBookedMultiDayHearing();
            service.bookingList = [MockGroupedBookings(multiDays)];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            // Simulate an update to the scheduled duration for all days in the multi day hearing
            const newScheduledDurationValue = 180;

            const hearing = { ...multiDays[0] };
            hearing.Booking.scheduledDuration = newScheduledDurationValue;
            hearing.Booking.hearingsInGroup = multiDays.map(x => {
                const hearingInGroup = { ...x };
                hearingInGroup.Booking.scheduledDuration = newScheduledDurationValue;
                return hearingInGroup.Booking;
            });

            hearing.Booking.hearingId = service.bookingList[0].BookingsDetails[0].Booking.hearingId;
            service.updateBooking(hearing.Booking);

            const updatedHearings = service.bookingList[0].BookingsDetails;
            updatedHearings.forEach(h => {
                expect(h.Booking.scheduledDuration).toBe(newScheduledDurationValue);
            });
        });

        it('should update judge name for selected hearing with judiciary participant judge', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearing(), MockBookedHearing()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = { ...service.bookingList[0].BookingsDetails[0] };
            const judge = hearing.Booking.judge;
            judge.displayName = 'Judge Test';

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.Booking.case = updatedCase;

            service.updateBooking(hearing.Booking);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.Booking.judge.displayName).toBe(judge.displayName);
        });

        it('should update judge name for selected hearing with judiciary participants but no judge', () => {
            service.bookingList = [MockGroupedBookings([MockBookedHearingWithoutJudge(), MockBookedHearingWithoutJudge()])];

            service.selectedGroupIndex = 0;
            service.selectedItemIndex = 0;

            const hearing = { ...service.bookingList[0].BookingsDetails[0] };
            const panelMember = hearing.Booking.judiciaryParticipants[0];
            panelMember.displayName = 'Panel Member';

            const updatedCase = new CaseModel();
            updatedCase.name = 'updated case';
            hearing.Booking.case = updatedCase;

            service.updateBooking(hearing.Booking);

            const updatedHearing = service.bookingList[0].BookingsDetails[0];
            expect(updatedHearing.Booking.judge).toBeNull();
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
