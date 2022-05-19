import { BreadcrumbItemModel } from './breadcrumbItem.model';

export const BreadcrumbItems: BreadcrumbItemModel[] = [
    {
        Id: 1,
        Value: true,
        Name: 'Hearing details',
        Url: '/book-hearing',
        Active: true,
        LastMinuteAmendable: false
    },
    {
        Id: 2,
        Value: false,
        Name: 'Hearing schedule',
        Url: '/hearing-schedule',
        Active: false,
        LastMinuteAmendable: false
    },
    {
        Id: 3,
        Value: false,
        Name: 'Judge',
        Url: '/assign-judge',
        Active: false,
        LastMinuteAmendable: true
    },
    {
        Id: 4,
        Value: false,
        Name: 'Participants',
        Url: '/add-participants',
        Active: false,
        LastMinuteAmendable: true
    },
    {
        Id: 5,
        Value: false,
        Name: 'Video access points',
        Url: '/video-access-points',
        Active: false,
        LastMinuteAmendable: false
    },
    {
        Id: 6,
        Value: false,
        Name: 'Other information',
        Url: '/other-information',
        Active: false,
        LastMinuteAmendable: false
    },
    {
        Id: 7,
        Value: false,
        Name: 'Summary',
        Url: '/summary',
        Active: false,
        LastMinuteAmendable: true
    }
];
