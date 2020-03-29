namespace AdminWebsite.AcceptanceTests.Hooks
{
    internal enum HooksSequence
    {
        ConfigHooks = 1,
        RegisterApisHooks = 2,
        HealthcheckHooks = 3,
        InitialiseBrowserHooks = 4,
        ConfigureDriverHooks = 5,
        RemoveDataHooks = 6,
        DataHooks = 7,
        SignOutHooks = 8,
        LogResultHooks = 9,
        TearDownBrowserHooks = 10
    }
}
