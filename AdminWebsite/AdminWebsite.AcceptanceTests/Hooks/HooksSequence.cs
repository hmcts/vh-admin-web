namespace AdminWebsite.AcceptanceTests.Hooks
{
    internal enum HooksSequence
    {
        CleanUpDriverInstances,
        ConfigHooks,
        RegisterApisHooks,
        HealthcheckHooks,
        InitialiseBrowserHooks,
        ConfigureDriverHooks,
        SetTimeZone,
        RemoveDataHooks,
        DataHooks,
        AudioRecording,
        RemoveNewUsersHooks,
        RemoveAudioFiles,
        LogResultHooks,
        TearDownBrowserHooks
    }
}
