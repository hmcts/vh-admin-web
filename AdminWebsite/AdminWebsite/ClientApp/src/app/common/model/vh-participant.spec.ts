import { HearingRoleCodes } from './hearing-roles.model';
import { VHParticipant } from './vh-participant';

describe('VHParticipant', () => {
    describe('fullName', () => {
        it('should get fullName', () => {
            // Arrange
            const participant = new VHParticipant({
                title: 'title',
                firstName: 'first-name',
                lastName: 'last-name'
            });

            // Act & Assert
            expect(participant.fullName).toEqual(`${participant.title} ${participant.firstName} ${participant.lastName}`);
        });
    });

    describe('isRepresenting', () => {
        it('should return true if userRoleName is Representative and representee is not empty', () => {
            // Arrange
            const participant = new VHParticipant({
                userRoleName: 'Representative',
                representee: 'representee'
            });

            // Act & Assert
            expect(participant.isRepresenting).toBeTruthy();
        });

        it('should return false if userRoleName is not Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                userRoleName: 'OtherRole',
                representee: 'representee'
            });

            // Act & Assert
            expect(participant.isRepresenting).toBeFalsy();
        });

        it('should return false if representee is empty', () => {
            // Arrange
            const participant = new VHParticipant({
                userRoleName: 'Representative',
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
                hearingRoleName: 'Interpreter'
            });

            // Act & Assert
            expect(participant.isInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleCode is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleCode: HearingRoleCodes.Interpreter
            });

            // Act & Assert
            expect(participant.isInterpreter).toBeTruthy();
        });

        it('should return false if hearingRoleName and hearingRoleCode are not Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleName: 'NotInterpreter',
                hearingRoleCode: 'NotInterpreter'
            });

            // Act & Assert
            expect(participant.isInterpreter).toBeFalsy();
        });
    });

    describe('isRepOrInterpreter', () => {
        it('should return true if hearingRoleName is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleName: 'Interpreter'
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleCode is Interpreter', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleCode: HearingRoleCodes.Interpreter
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleName is Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleName: 'Representative'
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return true if hearingRoleCode is Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleCode: HearingRoleCodes.Representative
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeTruthy();
        });

        it('should return false if hearingRoleName and hearingRoleCode are not Interpreter or Representative', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleName: 'OtherRole',
                hearingRoleCode: 'OtherRoleCode'
            });

            // Act & Assert
            expect(participant.isRepOrInterpreter).toBeFalsy();
        });
    });

    describe('isStaffMember', () => {
        it('should return true if hearingRoleCode is StaffMember', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleCode: HearingRoleCodes.StaffMember
            });

            // Act & Assert
            expect(participant.isStaffMember).toBeTruthy();
        });

        it('should return false if hearingRoleCode is not StaffMember', () => {
            // Arrange
            const participant = new VHParticipant({
                hearingRoleCode: 'OtherRoleCode'
            });

            // Act & Assert
            expect(participant.isStaffMember).toBeFalsy();
        });
    });
});
