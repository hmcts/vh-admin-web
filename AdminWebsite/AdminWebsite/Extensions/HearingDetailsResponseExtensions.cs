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
                var otherInformationDetails = GetOtherInformationObject(hearing.Other_information);
                if (otherInformationDetails.JudgeEmail != "")
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
                var otherInformationDetails = GetOtherInformationObject(hearing.Other_information);
                if (otherInformationDetails.JudgePhone != null)
                {
                    return true;
                }
            }
            return false;
        }

        public static string GetJudgeEmail(this HearingDetailsResponse hearing)
        {
            var email = GetOtherInformationObject(hearing.Other_information).JudgeEmail;
            if (email == string.Empty)
            {
                return null;
            }
            return email;
        }
        
        public static string GetJudgePhone(this HearingDetailsResponse hearing)
        {
            var phone = GetOtherInformationObject(hearing.Other_information).JudgePhone;
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
                var properties = otherInformation.Split("|");
                if (properties.Length > 2)
                {
                    return new OtherInformationDetails {OtherInformation = properties[2]};
                }

                return new OtherInformationDetails {OtherInformation = otherInformation};
            }
        }
    }
}