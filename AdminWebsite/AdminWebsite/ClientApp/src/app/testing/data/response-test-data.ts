import { BookingsListModel } from 'src/app/common/model/bookings-list.model';
import {
    HearingDetailsResponse,
    CaseResponse,
    ParticipantResponse,
    EndpointResponse,
    BookingsByDateResponse,
    BookingsHearingResponse,
    BookingsResponse,
    JusticeUserResponse
} from '../../services/clients/api-client';
import { v4 as uuid } from 'uuid';
import { BookingsListItemModel } from 'src/app/common/model/booking-list-item.model';
import { createVHBookingFromDetails } from 'src/app/common/model/vh-booking';

export class ResponseTestData {
    static getHearingResponseTestData(): HearingDetailsResponse {
        const response = new HearingDetailsResponse();
        const caseHearing = new CaseResponse();
        caseHearing.name = 'Smith vs Donner';
        caseHearing.number = 'XX3456234565';
        response.cases = [];
        response.cases.push(caseHearing);
        response.id = '1';
        response.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
        response.scheduled_duration = 125;
        response.other_information = 'some note';
        response.hearing_room_name = '777';
        response.created_date = new Date('2019-10-22 13:58:40.3730067');
        response.created_by = 'stub.response@hmcts.net';
        response.updated_by = 'stub.response@hmcts.net';
        response.updated_date = new Date('2019-10-22 13:58:40.3730067');
        response.confirmed_by = 'stub.response@hmcts.net';
        response.confirmed_date = new Date('2019-10-22 13:58:40.3730067');
        response.audio_recording_required = true;

        const par1 = new ParticipantResponse();
        par1.id = '1';
        par1.title = 'Mr';
        par1.first_name = 'Jo';
        par1.last_name = 'Smith';
        par1.user_role_name = 'Citizen';
        par1.username = 'username@hmcts.net';
        par1.telephone_number = '123456789';
        par1.hearing_role_name = 'Litigant in Person';

        const par2 = new ParticipantResponse();
        par2.id = '2';
        par2.title = 'Mr';
        par2.first_name = 'Judge';
        par2.last_name = 'Smith';
        par2.user_role_name = 'Judge';
        par2.username = 'usernamejudge@hmcts.net';
        par2.hearing_role_name = 'Judge';

        response.participants = [];
        response.participants.push(par1);
        response.participants.push(par2);

        const endpoint1 = new EndpointResponse();
        endpoint1.display_name = 'test endpoint 1';
        endpoint1.sip = '2213';
        endpoint1.pin = '2323';
        endpoint1.id = '022f5e0c-696d-43cf-6fe0-08d846dbdb21';
        response.endpoints = [];
        response.endpoints.push(endpoint1);
        return response;
    }

    static getUserData(): Array<JusticeUserResponse> {
        const list: Array<JusticeUserResponse> = [];
        let user = new JusticeUserResponse();
        user.id = uuid();
        user.username = 'username1@mail.com';
        user.contact_email = 'username1@mail.com';
        user.first_name = 'firstName1';
        user.lastname = 'lastName1';
        list.push(user);

        user = new JusticeUserResponse();
        user.id = uuid();
        user.username = 'username2@mail.com';
        user.contact_email = 'username2@mail.com';
        user.first_name = 'firstName2';
        user.lastname = 'lastName2';
        list.push(user);

        return list;
    }

    static getTestData(): BookingsResponse {
        const fixedDate = new Date('2019-10-22 13:58:40.3730067');
        const response = new BookingsResponse();
        const byDate = new BookingsByDateResponse();
        byDate.scheduled_date = fixedDate;
        byDate.hearings = new Array<BookingsHearingResponse>();

        const bhr = new BookingsHearingResponse({ hearing_date: fixedDate });
        bhr.hearing_id = '1';
        bhr.created_date = fixedDate;
        bhr.last_edit_date = fixedDate;
        bhr.scheduled_date_time = fixedDate;

        const bhr1 = new BookingsHearingResponse();
        bhr1.hearing_id = '2';

        byDate.hearings.push(bhr);
        byDate.hearings.push(bhr1);

        response.hearings = new Array<BookingsByDateResponse>();
        response.hearings.push(byDate);
        response.next_cursor = '12345670_3';
        return response;
    }

    static getEditingBookings(): Array<BookingsListModel> {
        const listModel: Array<BookingsListModel> = [];
        const model = new BookingsListModel(new Date('2019-12-22 00:00:00.0000000'));
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '1',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason1',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        const b2 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '12',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason2',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        const b3 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '33',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Tax',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason3',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;
        listModel.push(model);
        return listModel;
    }

    static getBookingsTestData(): Array<BookingsListModel> {
        const listModel: Array<BookingsListModel> = [];

        const model = new BookingsListModel(new Date('2019-10-22 00:00:00.0000000'));
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '1',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason11',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        const b2 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '12',
                new Date('2019-10-22 14:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason12',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        const b3 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '33',
                new Date('2019-10-22 14:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason13',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;

        const lists1: Array<BookingsListItemModel> = [];
        const model1 = new BookingsListModel(new Date('2019-11-22 00:00:00.0000000'));
        const b11 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '44',
                new Date('2019-11-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason21',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        const b21 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '45',
                new Date('2019-11-22 14:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason32',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        const b31 = new BookingsListItemModel(
            createVHBookingFromDetails(
                '46',
                new Date('2019-11-22 15:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
                'JadgeGreen',
                '33A',
                'Coronation Street',
                'John Smith',
                new Date('2018-10-22 13:58:40.3730067'),
                'Roy Ben',
                new Date('2018-10-22 13:58:40.3730067'),
                null,
                null,
                'Booked',
                true,
                'reason33',
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );

        lists1.push(b11);
        lists1.push(b21);
        lists1.push(b31);
        model1.BookingsDetails = lists1;

        listModel.push(model);
        listModel.push(model1);
        return listModel;
    }

    static getBookingResponse(): BookingsResponse {
        const bookingsResponse = new BookingsResponse();
        bookingsResponse.next_cursor = '1233';
        const dataRes = this.getTestData();
        bookingsResponse.hearings = new Array<BookingsByDateResponse>();
        bookingsResponse.hearings.push(dataRes);

        return bookingsResponse;
    }

    static getTestDataForBookingList(): BookingsByDateResponse {
        const date = new Date('2019-10-22 13:58:40.3730067');
        const bhr = new BookingsHearingResponse({ hearing_date: date });
        bhr.hearing_id = '1';
        bhr.created_date = date;
        bhr.last_edit_date = date;
        bhr.scheduled_date_time = date;
        bhr.court_address = 'court address';
        bhr.court_room = '12A';
        bhr.hearing_name = 'A vs B';
        bhr.hearing_number = '123A';
        bhr.judge_name = 'Judge';
        bhr.scheduled_duration = 45;
        bhr.created_by = 'Roy';
        bhr.last_edit_by = 'Sam';
        bhr.audio_recording_required = true;
        bhr.cancel_reason = 'some more information';

        const bhr1 = new BookingsHearingResponse({ hearing_date: date });
        bhr1.hearing_id = '2';
        bhr1.created_date = date;
        bhr1.last_edit_date = date;
        bhr1.scheduled_date_time = date;
        bhr1.court_address = 'court address';
        bhr1.court_room = '12A';
        bhr1.hearing_name = 'A vs B';
        bhr1.hearing_number = '123A';
        bhr1.judge_name = 'Judge';
        bhr1.scheduled_duration = 45;
        bhr1.created_by = 'Roy';
        bhr1.last_edit_by = 'Sam';
        bhr1.audio_recording_required = true;
        bhr1.cancel_reason = 'some more information1';

        const byDate = new BookingsByDateResponse();
        byDate.scheduled_date = new Date('2019-10-22 00:00:00.0000000');
        byDate.hearings = new Array<BookingsHearingResponse>();
        byDate.hearings.push(bhr);
        byDate.hearings.push(bhr1);

        return byDate;
    }
}
