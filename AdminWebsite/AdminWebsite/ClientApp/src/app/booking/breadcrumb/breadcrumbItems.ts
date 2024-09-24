import { PageUrls } from 'src/app/shared/page-url.constants';
import { BreadcrumbItemModel } from './breadcrumbItem.model';

export const BreadcrumbItems: BreadcrumbItemModel[] = [
    new BreadcrumbItemModel(1, true, 'Hearing details', PageUrls.CreateHearing, true, false),
    new BreadcrumbItemModel(2, false, 'Hearing schedule', PageUrls.HearingSchedule, false, false),
    new BreadcrumbItemModel(4, false, 'Judicial Office Holder(s)', PageUrls.AddJudicialOfficeHolders, false, true),
    new BreadcrumbItemModel(5, false, 'Participants', PageUrls.AddParticipants, false, true),
    new BreadcrumbItemModel(6, false, 'Video access points', PageUrls.Endpoints, false, true),
    new BreadcrumbItemModel(7, false, 'Screening (Special Measure)', PageUrls.Screening, false, true),
    new BreadcrumbItemModel(8, false, 'Other information', PageUrls.OtherInformation, false, false),
    new BreadcrumbItemModel(9, false, 'Summary', PageUrls.Summary, false, true)
];
