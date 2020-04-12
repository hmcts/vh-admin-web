using System;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class BookingDetailsPage
    {
        public static By CaseNumberTitle = By.Id("hearingNumber");
        public static By CreatedBy = By.Id("created-by");
        public static By CreatedDate = By.Id("created-date");
        public static By CaseNumber = By.Id("hearing-number");
        public static By CaseName = By.Id("hearing-name");
        public static By HearingType = By.Id("hearing-type");
        public static By HearingStartDate = By.Id("hearing-start");
        public static By CourtroomAddress = By.Id("court-room-address");
        public static By Duration = By.Id("duration");
        public static By AudioRecorded = By.Id("audioRecorded");
        public static By OtherInformation = By.Id("otherInformation");
        public static By EditButton = By.Id("edit-button");
        public static By CancelButton = By.Id("cancel-button");
        public static By ConfirmCancelButton = By.Id("btnCancelBooking");
        public static By ConfirmButton = By.Id("confirm-button");
        public static By ConfirmedLabel = By.Id("lblCreated");
        public static By JudgeName = By.Id("judge-name");
        public static By JudgeRole = By.Id("judge-hearing-role-name");
        public static By ParticipantName(Guid participantId) => By.Id($"participant-{participantId:D}-name");
        public static By ParticipantRole(Guid participantId) => By.Id($"participant-{participantId:D}-hearing-role-name");
        public static By ParticipantEmail(Guid participantId) => By.Id($"participant-{participantId:D}-email");
        public static By ParticipantUsername(Guid participantId) => By.Id($"participant-{participantId:D}-username");
        public static By ParticipantRepresentee(Guid participantId) => By.Id($"participant-{participantId:D}-representee");
        public static By CancelReasonDropdown = By.Id("cancel-reason");
        public static By CancelReasonDropdownErrorLabel = By.Id("cancelReason-error");
        public static By CancelReasonDetailsErrorLabel = By.Id("more-detail-error");
        public static By CancelReasonTextfield = By.Id("cancelReason-detail");
        public static By KeepBookingButton = By.Id("btnKeepBooking");
        public static By CaseType = By.Id("case-type");
    }
}
