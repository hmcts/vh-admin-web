export class MockAdalService {
    private userInfo = {
        authenticated: false,
        userName: 'test@hmcts.net',
        token: 'token'
    };
    init(configOptions: adal.Config) {}
    handleWindowCallback() {}
    login() {}
    logOut() {}
    setAuthenticated(flag: boolean) {
        this.userInfo.authenticated = flag;
    }
}
