export const IndividualQuestionKeys = {
    AboutYou: 'ABOUT_YOU',
    Consent: 'CONSENT',
    Room: 'ROOM',
    Internet: 'INTERNET',
    Interpreter: 'INTERPRETER',
    Computer: 'COMPUTER',
    Camera: 'CAMERA_MICROPHONE'
};

export const RepresentativeQuestionKeys = {
    PresentingTheCase: 'PRESENTING_THE_CASE',
    PresentingTheCaseName: 'PRESENTING_NAME',
    PresentingTheCaseEmail: 'PRESENTING_EMAIL',
    OtherInformation: 'OTHER_INFORMATION'
};

export const SelfTestQuestionKeys = {
    SelfTestScore: 'KIT_SELFTEST_SCORE',
    SeeYourself: 'KIT_SEE_YOURSELF',
    Microphone: 'KIT_MICROPHONE',
    SeeHearClearly: 'KIT_SEE_HEAR_CLEARLY'
};

export interface QuestionsMapAttributes {
    QuestionsOrder: string[];
    Questions: Map<string, QuestionAnswer>;
    AnswerOverrides: Map<string, string>;
}

export class IndividualQuestionsMapAttributes implements QuestionsMapAttributes {
    public readonly QuestionsOrder = [
        IndividualQuestionKeys.AboutYou,
        IndividualQuestionKeys.Interpreter,
        IndividualQuestionKeys.Computer,
        IndividualQuestionKeys.Camera,
        IndividualQuestionKeys.Internet,
        IndividualQuestionKeys.Room,
        IndividualQuestionKeys.Consent
    ];

    public readonly Questions = new Map<string, QuestionAnswer>([
        [
            IndividualQuestionKeys.AboutYou,
            {
                Question:
                'Is there anything you\'d like the court to take into account when it decides which type of hearing will be suitable?'
            }
        ],
        [
            IndividualQuestionKeys.Interpreter,
            { Question: 'Will you need an interpreter for your hearing?' }
        ],
        [
            IndividualQuestionKeys.Computer,
            { Question: 'Will you have access to a laptop or desktop computer (not a mobile, not a tablet)?' }
        ],
        [
            IndividualQuestionKeys.Camera,
            { Question: 'Does your computer have a camera and microphone?' }
        ],
        [
            IndividualQuestionKeys.Internet,
            { Question: 'At the time of your hearing, will the computer be able to access the internet?' }
        ],
        [
            IndividualQuestionKeys.Room,
            { Question: 'At the time of your hearing, will you have access to a quiet, private room?' }
        ],
        [
            IndividualQuestionKeys.Consent,
            { Question: 'Would you be content to take part in your hearing by video?' }
        ]
    ]);

    public readonly AnswerOverrides = new Map<string, string>([
        ['ind', 'individual']
    ]);
}

export class RepresentativeQuestionsMapAttributes implements QuestionsMapAttributes {
    public readonly QuestionsOrder = [
        RepresentativeQuestionKeys.PresentingTheCase,
        RepresentativeQuestionKeys.OtherInformation
    ];

    public readonly Questions = new Map<string, QuestionAnswer>([
        [
            RepresentativeQuestionKeys.PresentingTheCase,
            {
                Question: 'Someone will be presenting the case?',
                DefaultAnswer: 'I will be presenting the case',
                EmbeddedAnswersInNotes:
                    [
                        RepresentativeQuestionKeys.PresentingTheCaseName,
                        RepresentativeQuestionKeys.PresentingTheCaseEmail
                    ]
            }
        ],
        [RepresentativeQuestionKeys.PresentingTheCaseName, { Question: 'Name:' }],
        [RepresentativeQuestionKeys.PresentingTheCaseEmail, { Question: 'Email:' }],
        [
            RepresentativeQuestionKeys.OtherInformation,
            {
                Question: 'Is there anything you\'d like the court to know that could affect this hearing taking place by video?',
                DefaultAnswer: ''
            }
        ]
    ]);

    public readonly AnswerOverrides = new Map<string, string>([
        ['Someone will be presenting the case', 'Yes']
    ]);
}

export class SelfTestQuestionsMapAttributes implements QuestionsMapAttributes {

    public readonly QuestionsOrder = [
        SelfTestQuestionKeys.SelfTestScore,
        SelfTestQuestionKeys.SeeYourself,
        SelfTestQuestionKeys.Microphone,
        SelfTestQuestionKeys.SeeHearClearly,
    ];

    public readonly Questions = new Map<string, QuestionAnswer>([
        [SelfTestQuestionKeys.SelfTestScore, { Question: 'Self test score:', DefaultAnswer: 'N/A' }],
        [SelfTestQuestionKeys.SeeYourself, { Question: 'Could you see yourself on the screen in the camera window?' }],
        [SelfTestQuestionKeys.Microphone, { Question: 'Could you see the bar moving when you spoke?' }],
        [SelfTestQuestionKeys.SeeHearClearly, { Question: 'Could you see and hear the video clearly?' }]
    ]);

    public readonly AnswerOverrides = new Map<string, string>([
        ['self', 'selftest']
    ]);
}

export class QuestionAnswer {
    Question: string;
    DefaultAnswer?: string;
    EmbeddedAnswersInNotes?: string[];
}
