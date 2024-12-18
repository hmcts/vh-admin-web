import { HearingRoleCodes } from './hearing-roles.model';
import { VHParticipant } from './vh-participant';

describe('VHParticipant', () => {
    describe('fullName', () => {
        it('should get fullName', () => {
            // Arrange
            const participant = new VHParticipant({
                title: 'title',
                first_name: 'first-name',
                last_name: 'last-name'
            });

            // Act & Assert
            expect(participant.fullName).toEqual(`${participant.title} ${participant.first_name} ${participant.last_name}`);
        });
    });

    describe('isRepresenting', () => {
        it('should return true if userRoleName is Representative and representee is not empty', () => {
            // Arrange
            const participant = new VHParticipant({
                user_role_name: 'Representative',
                representee: 'representee'
            });

            // Act & Assert
            expect(participant.isRepresenting).toBeTruthy();
        });

        it('should return false if userRoleName is not Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                user_role_name: 'OtherRole',
                representee: 'representee'
            });

            // Act & Assert
            expect(participant.isRepresenting).toBeFalsy();
        });

        it('should return false if representee is empty', () => {
            // Arrange
            const participant = new VHParticipant({
                user_role_name: 'Representative',
                representee: ''
            });

            // Act & Assert
            expect(participant.isRepresenting).toBeFalsy();
        });
    });

    describe('isInterpreter', () => {
        it('should return true if hearingRoleName is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'Interpreter'
            });

            // Act & Assert
            expect(participant.isInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleCode is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_code: HearingRoleCodes.Interpreter
            });

            // Act & Assert
            expect(participant.isInterpreter).toBeTruthy();
        });

        it('should return false if hearingRoleName and hearingRoleCode are not Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'NotInterpreter',
                hearing_role_code: 'NotInterpreter'
            });

            // Act & Assert
            expect(participant.isInterpreter).toBeFalsy();
        });
    });

    describe('isRepOrInterpreter', () => {
        it('should return true if hearingRoleName is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'Interpreter'
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleCode is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_code: HearingRoleCodes.Interpreter
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleName is Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'Representative'
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleCode is Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_code: HearingRoleCodes.Representative
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return false if hearingRoleName and hearingRoleCode are not Interpreter or Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'OtherRole',
                hearing_role_code: 'OtherRoleCode'
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeFalsy();
        });
    });

    describe('isStaffMember', () => {
        it('should return true if hearingRoleCode is StaffMember', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_code: HearingRoleCodes.StaffMember
            });

            // Act & Assert
            expect(participant.isStaffMember).toBeTruthy();
        });

        it('should return false if hearingRoleCode is not StaffMember', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_code: 'OtherRoleCode'
            });

            // Act & Assert
            expect(participant.isStaffMember).toBeFalsy();
        });
    });

    describe('is_judge', () => {
        it('should return true if hearingRoleName is Judge', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'Judge'
            });

            // Act & Assert
            expect(participant.is_judge).toBeTruthy();
        });

        it('should return false if hearingRoleName is not Judge', () => {
            // Arrange
            const participant = new VHParticipant({
                hearing_role_name: 'OtherRole'
            });

            // Act & Assert
            expect(participant.is_judge).toBeFalsy();
        });
    });

    describe('IsEmailEjud', () => {
        it('should return true if email includes judiciary', () => {
            // Arrange
            const participant = new VHParticipant({
                email: 'test@judiciary.com'
            });

            // Act & Assert
            expect(participant.IsEmailEjud).toBeTruthy();
        });

        it('should return false if email does not include judiciary', () => {
            // Arrange
            const participant = new VHParticipant({
                email: 'test@email.com'
            });

            // Act & Assert
            expect(participant.IsEmailEjud).toBeFalsy();
        });
    });
});
