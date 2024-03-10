import { HearingModel } from 'src/app/common/model/hearing.model';

// Creates a multi day hearing from an existing hearing model
export function createMultiDayHearing(currentHearing: HearingModel) {
    const multiDayHearing: HearingModel = Object.assign({}, currentHearing);
    multiDayHearing.isMultiDay = true;
    const scheduledDateTime = new Date();
    scheduledDateTime.setSeconds(0);
    multiDayHearing.scheduled_date_time = scheduledDateTime;
    multiDayHearing.hearing_id = '1';
    multiDayHearing.hearingsInGroup = [];
    const daysInHearing = 3;
    for (let i = 1; i <= daysInHearing; i++) {
        const hearing: HearingModel = Object.assign({}, multiDayHearing);
        if (i > 1) {
            const datetime = new Date(multiDayHearing.scheduled_date_time);
            datetime.setDate(multiDayHearing.scheduled_date_time.getDate() + i - 1);
            hearing.scheduled_date_time = datetime;
            hearing.hearing_id = i.toString();
            hearing.originalScheduledDateTime = hearing.scheduled_date_time;
        }
        multiDayHearing.hearingsInGroup.push(hearing);
    }
    const lastHearing = multiDayHearing.hearingsInGroup[multiDayHearing.hearingsInGroup.length - 1];
    multiDayHearing.multiDayHearingLastDayScheduledDateTime = lastHearing.scheduled_date_time;
    multiDayHearing.hearingsInGroup.forEach(h => {
        h.multiDayHearingLastDayScheduledDateTime = lastHearing.scheduled_date_time;
    });

    return multiDayHearing;
}
