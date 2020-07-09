namespace AdminWebsite.AcceptanceTests.Hooks
{
    internal enum HooksSequence
    {
        ConfigHooks = 1,
        RegisterApisHooks = 2,
        HealthcheckHooks = 3,
        InitialiseBrowserHooks = 4,
        ConfigureDriverHooks = 5,
        SetTimeZone = 6,
        RemoveDataHooks = 7,
        DataHooks = 8,
        AudioRecording = 9,
        RemoveNewUsersHooks = 10,
        RemoveAudioFiles = 11,
        LogResultHooks = 12,
        TearDownBrowserHooks = 13
    }
}
