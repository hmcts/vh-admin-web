import { AnswerQuestion } from './checklist.model';

describe('AnswerQuestion model', () => {
    it('should be able to set the question text based on key', () => {
        const answer = new AnswerQuestion('ANY_OTHER_CIRCUMSTANCES', 'no', 'Citizen');
        expect(answer.Question).toContain('Is there anything the court');
    });

    it('should throw exception on unsupported role', () => {
        let question: AnswerQuestion = null;
        expect(() => {
            question = new AnswerQuestion('ANY_OTHER_CIRCUMSTANCES', 'no', 'Judge');
        }).toThrow(new Error('Cannot find question text for unsupported role: Judge'));
    });

    it('should gracefully fall back to question key if no text exists', () => {
        const questionKey = 'ANY_OTHER_CIRCUMSTANCES_NEW';
        const answer = new AnswerQuestion(questionKey, 'no', 'Citizen');
        expect(answer.Question).toBe(questionKey);
    });
});
