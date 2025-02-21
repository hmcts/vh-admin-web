import { isAValidEmail } from './email-validator';

it('should validate email and return true', () => {
    const emails = [
        'correct.email@test.com',
        'w.c@email.co.uk',
        'long.email-address-with-hyphens@and.subdomains.example.com',
        'name/surname@example.com',
        'josé.köln@email.com',
        'Áá@créâtïvéàççénts.com'
    ];
    emails.forEach(email => {
        expect(isAValidEmail(email)).withContext(email).toBe(true);
    });
});

it('should validate email and return false if it has invalid pattern', () => {
    const emails = [
        'ampersand&email@test.com',
        'email@invalid..com',
        'abc.example.co',
        'x.x.@example.com',
        'x.@example.com',
        'i.like.underscores@but_they_are_not_allowed_in_this_part'
    ];
    emails.forEach(email => {
        expect(isAValidEmail(email)).withContext(email).toBe(false);
    });
});
