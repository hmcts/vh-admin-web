import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from 'src/app/services/clients/api-client';

export interface SearchResults {
    result: VhoWorkHoursResponse[] | VhoNonAvailabilityWorkHoursResponse[];
    refresh: boolean;
}
