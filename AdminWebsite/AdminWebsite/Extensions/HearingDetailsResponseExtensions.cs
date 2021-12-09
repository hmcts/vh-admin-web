using System;
using System.Linq;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;
using Newtonsoft.Json;

namespace AdminWebsite.Extensions
{
    public static class HearingDetailsResponseExtensions
    {
        public static bool IsGenericHearing(this HearingDetailsResponse hearing)
        {
            return hearing.CaseTypeName.Equals("Generic", StringComparison.CurrentCultureIgnoreCase);
        }

        public static bool HasScheduleAmended(this HearingDetailsResponse hearing, HearingDetailsResponse anotherHearing)

        {
            return hearing.ScheduledDateTime.Ticks != anotherHearing.ScheduledDateTime.Ticks;
        }
        public static bool JudgeHasNotChangedForGenericHearing(this HearingDetailsResponse newHearingJudge,
            HearingDetailsResponse originalHearingJudge)
        {
            var judgeFromUpdatedHearing = newHearingJudge.GetJudgeById();
            var judgeFromOriginalHearing = originalHearingJudge.GetJudgeById();

            if((judgeFromUpdatedHearing != judgeFromOriginalHearing) && newHearingJudge.IsGenericHearing()) return false;
            return true;
        }
        private static Guid? GetJudgeById(this HearingDetailsResponse hearing)
        {
            var judgeId = hearing?.Participants.SingleOrDefault(x =>
                x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))?.Id;
            return judgeId;
        }

        public static bool HasJudgeEmailChanged(this HearingDetailsResponse hearing,
            HearingDetailsResponse originalHearing)
        {
            var isNewJudgeEJud = IsJudgeEmailEJud(hearing);
            var isOriginalJudgeEJud = IsJudgeEmailEJud(originalHearing);
            var isNewJudgeVhJudge = hearing.GetJudgeEmail() != null;
            var isOriginalJudgeVhJudge = originalHearing.GetJudgeEmail() != null;


            if (isNewJudgeEJud && isOriginalJudgeEJud)
            {
                var judgeA = hearing.Participants.FirstOrDefault(x =>
                    x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase));


                var judgeB = originalHearing.Participants.FirstOrDefault(x =>
                    x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase));

                return judgeA?.ContactEmail != judgeB?.ContactEmail;
            }

            if (isNewJudgeVhJudge && isOriginalJudgeVhJudge)
            {
                return hearing.GetJudgeEmail() != originalHearing.GetJudgeEmail();
            }

            return isNewJudgeEJud || isOriginalJudgeEJud || isNewJudgeVhJudge || isOriginalJudgeVhJudge;
        }

        public static bool DoesJudgeEmailExist(this HearingDetailsResponse hearing)
        {
            if (hearing.IsJudgeEmailEJud())
            {
                return true;
            }

            if (hearing.OtherInformation == null) return false;
            var otherInformationDetails = GetOtherInformationObject(hearing.OtherInformation);
            return !string.IsNullOrEmpty(otherInformationDetails.JudgeEmail);
        }

        public static bool DoesJudgePhoneExist(this HearingDetailsResponse hearing)
        {
            if (hearing.OtherInformation == null) return false;
            var otherInformationDetails = GetOtherInformationObject(hearing.OtherInformation);
            return !string.IsNullOrWhiteSpace(otherInformationDetails.JudgePhone);
        }

        public static string GetJudgeEmail(this HearingDetailsResponse hearing)
        {

            var email = GetOtherInformationObject(hearing.OtherInformation)?.JudgeEmail;
            if (string.IsNullOrEmpty(email))
            {
                return null;
            }

            return email;
        }

        public static bool IsJudgeEmailEJud(this HearingDetailsResponse hearing)
        {
            var judge = hearing?.Participants.SingleOrDefault(x =>
                x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase));
            return IsEmailEjud(judge?.Username);
        }

        public static bool IsParticipantAEJudJudicialOfficeHolder(this HearingDetailsResponse hearing, Guid participantId)
        {
            var joh = hearing?.Participants.SingleOrDefault(x => x.Id == participantId &&
               x.UserRoleName.Contains(RoleNames.JudicialOfficeHolder, StringComparison.CurrentCultureIgnoreCase));

            return IsEmailEjud(joh?.Username);
        }

        public static bool IsParticipantAJudicialOfficeHolderOrJudge(this HearingDetailsResponse hearing,
            Guid participantId)
        {
            var joh = hearing?.Participants.SingleOrDefault(x => x.Id == participantId &&
                                                                 x.UserRoleName.Contains(RoleNames.JudicialOfficeHolder,
                                                                     StringComparison.CurrentCultureIgnoreCase));
            var judge = hearing?.Participants.SingleOrDefault(x => x.Id == participantId &&
                                                                   x.UserRoleName.Contains(RoleNames.Judge,
                                                                       StringComparison.CurrentCultureIgnoreCase));
            var result = joh != null || judge != null;
            return result;
        }

        private static bool IsEmailEjud(string email)
        {
            return !string.IsNullOrEmpty(email) && email.Contains("judiciary", StringComparison.CurrentCultureIgnoreCase);
        }

        public static string GetJudgePhone(this HearingDetailsResponse hearing)
        {
            var phone = GetOtherInformationObject(hearing.OtherInformation).JudgePhone;
            if (phone == string.Empty)
            {
                return null;
            }

            return phone;
        }

        public static string ToOtherInformationString(this OtherInformationDetails otherInformationDetailsObject)
        {
            return
                $"|JudgeEmail|{otherInformationDetailsObject.JudgeEmail}" +
                $"|JudgePhone|{otherInformationDetailsObject.JudgePhone}" +
                $"|OtherInformation|{otherInformationDetailsObject.OtherInformation}";
        }

        public static HearingDetailsResponse Duplicate(this HearingDetailsResponse hearingDetailsResponse)
        {
            var json = JsonConvert.SerializeObject(hearingDetailsResponse);
            return JsonConvert.DeserializeObject<HearingDetailsResponse>(json);
        }

        private static OtherInformationDetails GetOtherInformationObject(string otherInformation)
        {
            try
            {
                var properties = otherInformation.Split("|");
                var otherInfo = new OtherInformationDetails
                {
                    JudgeEmail = Array.IndexOf(properties, "JudgeEmail") > -1
                        ? properties[Array.IndexOf(properties, "JudgeEmail") + 1]
                        : "",
                    JudgePhone = Array.IndexOf(properties, "JudgePhone") > -1
                        ? properties[Array.IndexOf(properties, "JudgePhone") + 1]
                        : "",
                    OtherInformation = Array.IndexOf(properties, "OtherInformation") > -1
                        ? properties[Array.IndexOf(properties, "OtherInformation") + 1]
                        : ""
                };
                return otherInfo;
            }
            catch (Exception)
            {
                if (string.IsNullOrWhiteSpace(otherInformation))
                {
                    return new OtherInformationDetails { OtherInformation = otherInformation };
                }

                var properties = otherInformation.Split("|");
                if (properties.Length > 2)
                {
                    return new OtherInformationDetails { OtherInformation = properties[2] };
                }

                return new OtherInformationDetails { OtherInformation = otherInformation };
            }
        }
    }
}