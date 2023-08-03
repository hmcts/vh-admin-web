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
        const roles1 = [JusticeUserRole.Vho];
        const roles2 = [JusticeUserRole.VhTeamLead];
        const roles3 = [JusticeUserRole.Vho];
        it('should correctly display roles', () => {
            const result = pipe.transform(roles1);
            expect(result).toBe(AvailableRoles[0].shortText);
        });
        it('should correctly display roles', () => {
            const result = pipe.transform(roles2);
            expect(result).toBe(AvailableRoles[1].shortText);
        });
        it('should correctly display 1 role without comma', () => {
            const result = pipe.transform(roles3);
            expect(result).toBe(AvailableRoles[0].shortText);
        });
    });
});
