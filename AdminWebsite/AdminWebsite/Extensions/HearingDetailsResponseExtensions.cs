using System;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using Newtonsoft.Json;

namespace AdminWebsite.Extensions
{
    public static class HearingDetailsResponseExtensions
    {
        public static bool IsGenericHearing(this HearingDetailsResponse hearing)
        {
            return hearing.Case_type_name.Equals("Generic", StringComparison.CurrentCultureIgnoreCase);
        }
        
        public static bool HasScheduleAmended(this HearingDetailsResponse hearing, HearingDetailsResponse anotherHearing)
        {
            return hearing.Scheduled_date_time.Ticks != anotherHearing.Scheduled_date_time.Ticks;
        }
        
        public static bool IsAClone(this HearingDetailsResponse hearing)
        {
            return hearing.Id != hearing.Group_id;
        }

        public static bool DoesJudgeEmailExist(this HearingDetailsResponse hearing)
        {
            if (hearing.Other_information != null)
            {
                var otherInformationDetails = GetOtherInformationObjectFromString(hearing.Other_information);
                if (otherInformationDetails.JudgeEmail != null)
                {
                    return true;
                }
            }
            return false;
        }
        
        public static bool DoesJudgePhoneExist(this HearingDetailsResponse hearing)
        {
            if (hearing.Other_information != null)
            {
                var otherInformationDetails = GetOtherInformationObjectFromString(hearing.Other_information);
                if (otherInformationDetails.JudgePhone != null)
                {
                    return true;
                }
            }
            return false;
        }

        public static string GetJudgeContactEmail(this HearingDetailsResponse hearing)
        {
            return GetOtherInformationObjectFromString(hearing.Other_information).JudgeEmail;
        }
        
        public static string GetJudgePhone(this HearingDetailsResponse hearing)
        {
            return GetOtherInformationObjectFromString(hearing.Other_information).JudgePhone;
        }

        private static OtherInformationDetails GetOtherInformationObjectFromString(string otherInformation)
        {
            return JsonConvert.DeserializeObject<OtherInformationDetails>(otherInformation);
        }
    }
}