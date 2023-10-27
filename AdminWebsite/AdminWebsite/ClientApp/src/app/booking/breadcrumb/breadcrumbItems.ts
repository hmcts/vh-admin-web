import { PageUrls } from 'src/app/shared/page-url.constants';
import { BreadcrumbItemModel } from './breadcrumbItem.model';

export const BreadcrumbItems: BreadcrumbItemModel[] = [
    {
        Id: 1,
        Value: true,
        Name: 'Hearing details',
        Url: PageUrls.CreateHearing,
        Active: true,
        LastMinuteAmendable: false
    },
    {
        Id: 2,
        Value: false,
        Name: 'Hearing schedule',
        Url: PageUrls.HearingSchedule,
        Active: false,
        LastMinuteAmendable: false
    },
    {
        Id: 3,
        Value: false,
        Name: 'Judge',
        Url: PageUrls.AssignJudge,
        Active: false,
        LastMinuteAmendable: true
    },
    {
        Id: 4,
        Value: false,
        Name: 'Judicial Office Holder(s)',
        Url: PageUrls.AddJudicialOfficeHolders,
        Active: false,
        LastMinuteAmendable: true
    },
    {
        Id: 4,
        Value: false,
        Name: 'Participants',
        Url: PageUrls.AddParticipants,
        Active: false,
        LastMinuteAmendable: true
    },
    {
        Id: 5,
        Value: false,
        Name: 'Video access points',
        Url: PageUrls.Endpoints,
        Active: false,
        LastMinuteAmendable: true
    },
    {
        Id: 6,
        Value: false,
        Name: 'Other information',
        Url: PageUrls.OtherInformation,
        Active: false,
        LastMinuteAmendable: false
    },
    {
        Id: 7,
        Value: false,
        Name: 'Summary',
        Url: PageUrls.Summary,
        Active: false,
        LastMinuteAmendable: true
    }
];
