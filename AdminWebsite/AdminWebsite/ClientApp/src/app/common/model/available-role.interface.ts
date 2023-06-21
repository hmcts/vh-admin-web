import { JusticeUserRole } from '../../services/clients/api-client';

export interface AvailableRole {
    value: JusticeUserRole;
    label: string;
    shortText: string;
}
