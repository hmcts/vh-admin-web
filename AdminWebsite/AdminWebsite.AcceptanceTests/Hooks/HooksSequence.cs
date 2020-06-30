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
        AudioRecording = 8,
        RemoveNewUsersHooks = 9,
        RemoveAudioFiles = 10,
        LogResultHooks = 11,
        TearDownBrowserHooks = 12
    }
}
