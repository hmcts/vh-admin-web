import { RolesToDisplayPipe } from './roles-to-display.pipe';
import { JusticeUserRole } from '../../services/clients/api-client';
import { AvailableRoles } from '../../common/constants';

let pipe: RolesToDisplayPipe;
beforeAll(() => {
    pipe = new RolesToDisplayPipe();
});
describe('RolesToDisplayPipe', () => {
    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    describe('rolesToDisplay', () => {
        const roles1 = [JusticeUserRole.Vho, JusticeUserRole.StaffMember];
        const roles2 = [JusticeUserRole.VhTeamLead, JusticeUserRole.StaffMember];
        const roles3 = [JusticeUserRole.Vho];
        const roles4 = [JusticeUserRole.StaffMember];
        it('should correctly display roles', () => {
            const result = pipe.transform(roles1);
            expect(result).toBe(AvailableRoles[0].shortText + ', ' + AvailableRoles[2].shortText);
        });
        it('should correctly display roles', () => {
            const result = pipe.transform(roles2);
            expect(result).toBe(AvailableRoles[1].shortText + ', ' + AvailableRoles[2].shortText);
        });
        it('should correctly display 1 role without comma', () => {
            const result = pipe.transform(roles3);
            expect(result).toBe(AvailableRoles[0].shortText);
        });
        it('should correctly display 1 role without comma', () => {
            const result = pipe.transform(roles4);
            expect(result).toBe(AvailableRoles[2].shortText);
        });
    });
});
