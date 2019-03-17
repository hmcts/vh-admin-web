
using System.Collections.Generic;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public static class TableExtension
    {
        public static Dictionary<string, dynamic> DataTable(Table table)
        {
            var dictionary = new Dictionary<string, dynamic>();
            foreach (var row in table.Rows)
            {
                dictionary.Add(row[0], row[1]);
            }
            return dictionary;
        }
    }
}
