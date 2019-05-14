using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;

namespace AdminWebsite
{
    public class Program
    {
        protected Program()
        {

        }

        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseApplicationInsights()
                .UseKestrel(c => c.AddServerHeader = false)
                .UseStartup<Startup>();
    }
}
