import { VHBooking } from 'src/app/common/model/vh-booking';

// Creates a multi day hearing from an existing hearing model
export function createMultiDayHearing(currentHearing: VHBooking) {
    const multiDayHearing: VHBooking = Object.assign({}, currentHearing);
    multiDayHearing.isMultiDay = true;
    const scheduledDateTime = new Date();
    scheduledDateTime.setSeconds(0);
    multiDayHearing.scheduledDateTime = scheduledDateTime;
    multiDayHearing.hearingId = '1';
    multiDayHearing.hearingsInGroup = [];
    const daysInHearing = 4;
    for (let i = 1; i <= daysInHearing; i++) {
        const hearing: VHBooking = Object.assign({}, multiDayHearing);
        if (i > 1) {
            const datetime = new Date(multiDayHearing.scheduledDateTime);
            datetime.setDate(multiDayHearing.scheduledDateTime.getDate() + i - 1);
            hearing.scheduledDateTime = datetime;
            hearing.hearingId = i.toString();
            hearing.originalScheduledDateTime = hearing.scheduledDateTime;
        }
        multiDayHearing.hearingsInGroup.push(hearing);
    }
    const lastHearing = multiDayHearing.hearingsInGroup[multiDayHearing.hearingsInGroup.length - 1];
    multiDayHearing.multiDayHearingLastDayScheduledDateTime = lastHearing.scheduledDateTime;
    multiDayHearing.hearingsInGroup.forEach(h => {
        h.multiDayHearingLastDayScheduledDateTime = lastHearing.scheduledDateTime;
    });

    return multiDayHearing;
}
