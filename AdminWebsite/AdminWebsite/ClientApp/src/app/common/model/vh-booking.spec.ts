import { VHBooking } from './vh-booking';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';

describe('VHBooking', () => {
    describe('durationInHoursAndMinutes', () => {
        it('should return durationInHoursAndMinutes', () => {
            // Arrange
            const booking = new VHBooking({
                scheduledDuration: 90
            });

            // Act
            const result = booking.durationInHoursAndMinutes;

            // Assert
            expect(result).toBe('1 hour 30 minutes');
        });
    });

    describe('isCancelled', () => {
        it('should return true if status is Cancelled', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'Cancelled'
            });

            // Act
            const result = booking.isCancelled;

            // Assert
            expect(result).toBe(true);
        });

        it('should return false if status is not Cancelled', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'NotCancelled'
            });

            // Act
            const result = booking.isCancelled;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('isCreated', () => {
        it('should return true if status is Created', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'Created'
            });

            // Act
            const result = booking.isCreated;

            // Assert
            expect(result).toBe(true);
        });

        it('should return false if status is not Created', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'NotCreated'
            });

            // Act
            const result = booking.isCreated;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('hasBookingConfirmationFailed', () => {
        it('should return true if status is Failed', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'Failed'
            });

            // Act
            const result = booking.hasBookingConfirmationFailed;

            // Assert
            expect(result).toBe(true);
        });

        it('should return false if status is not Failed', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'NotFailed'
            });

            // Act
            const result = booking.hasBookingConfirmationFailed;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('hasConfirmationWithNoJudge', () => {
        it('should return true if status is ConfirmedWithoutJudge', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'ConfirmedWithoutJudge'
            });

            // Act
            const result = booking.hasConfirmationWithNoJudge;

            // Assert
            expect(result).toBe(true);
        });

        it('should return false if status is not ConfirmedWithoutJudge', () => {
            // Arrange
            const booking = new VHBooking({
                status: 'NotConfirmedWithoutJudge'
            });

            // Act
            const result = booking.hasConfirmationWithNoJudge;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('hearingDuration', () => {
        it('should return hearingDuration', () => {
            // Arrange
            const booking = new VHBooking({
                scheduledDuration: 90
            });

            // Act
            const result = booking.hearingDuration;

            // Assert
            expect(result).toBe('listed for 1 hour 30 minutes');
        });
    });

    describe('courtRoomAddress', () => {
        it('should return courtRoomAddress', () => {
            // Arrange
            const booking = new VHBooking({
                courtName: 'court-name',
                courtRoom: 'court-room'
            });

            // Act
            const result = booking.courtRoomAddress;

            // Assert
            expect(result).toBe('court-name, court-room');
        });
    });

    describe('audioChoice', () => {
        it('should return Yes when audioRecordingRequired is true', () => {
            // Arrange
            const booking = new VHBooking({
                audioRecordingRequired: true
            });

            // Act
            const result = booking.audioChoice;

            // Assert
            expect(result).toBe('Yes');
        });

        it('should return No when audioRecordingRequired is false', () => {
            // Arrange
            const booking = new VHBooking({
                audioRecordingRequired: false
            });

            // Act
            const result = booking.audioChoice;

            // Assert
            expect(result).toBe('No');
        });
    });

    describe('judge', () => {
        it('should return judge when judge is present', () => {
            // Arrange
            const judge = new JudicialMemberDto(null, null, null, null, null, null, false, 'judge-name');
            judge.roleCode = 'Judge';

            const booking = new VHBooking({
                judiciaryParticipants: [judge]
            });

            // Act
            const result = booking.judge;

            // Assert
            expect(result).toEqual(judge);
        });

        it('should return null when no judiciary participants exist', () => {
            // Arrange
            const booking = new VHBooking();

            // Act
            const result = booking.judge;

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when judiciary participants exist but no judge', () => {
            // Arrange
            const pm = new JudicialMemberDto(null, null, null, null, null, null, false, 'pm-name');
            pm.roleCode = 'PanelMember';

            const booking = new VHBooking({
                judiciaryParticipants: [pm]
            });

            // Act
            const result = booking.judge;

            // Assert
            expect(result).toBeNull();
        });
    });
});
