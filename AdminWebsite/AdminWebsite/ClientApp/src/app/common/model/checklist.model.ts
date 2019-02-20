import { Constants } from '../constants';

export class ChecklistModel {
    constructor(participantId: number, title: string, firstName: string,
        surname: string, hearingCase: string, hearingName: string, completedDate: Date) {
        this.ParticipantId = participantId;
        this.FirstName = firstName;
        this.Surname = surname;
        this.Title = title;
        this.HearingCase = hearingCase;
        this.HearingName = hearingName;
        this.CompletedDate = completedDate;
        this.IsExpanded = false;
    }

    ParticipantId: number;
    Title: string;
    FirstName: string;
    Surname: string;
    HearingCase: string;
    HearingName: string;
    CompletedDate: Date;
    IsExpanded: boolean;

    Answers: Array<AnswerQuestion>;

    get FullName() {
        return `${this.Title} ${this.FirstName} ${this.Surname}`;
    }
}

export class AnswerQuestion {
    constructor(questionKey: string, answer: string, role: string, notes: string = null) {
        this.Answer = answer;
        this.QuestionKey = questionKey;
        this.Notes = notes;
        this.Question = this.findQuestionText(role);
    }

    QuestionKey: string;
    Answer: string;
    Notes: string;
    Question: string;

    private findQuestionText(role: string): string {
        let questionList: any;
        switch (role) {
            case Constants.Citizen:
                questionList = Questions.Citizen;
                break;
            case Constants.Professional:
                questionList = Questions.Professional;
                break;
            default:
                throw new Error(`Cannot find question text for unsupported role: ${role}`);
        }

        // Fallback to using the key in case we have a question without mapping
        return questionList[this.QuestionKey] || this.QuestionKey;
    }
}

const Questions = {
    Professional: {
        'ANY_OTHER_CIRCUMSTANCES': 'Is there anything that could affect your ability to take part in video hearing?',
        'SUITABLE_ROOM_AVAILABLE': 'Will you have access to a suitable room?',
        'USER_CONSENT': 'Do you consider the hearing suitable for a video hearing?',
        'NEED_INTERPRETER': 'If your client attending the hearing will they need an intepreter?',
        'OTHER_PERSON_IN_ROOM': 'Will your client be attending the hearing with you?',
        'EQUIPMENT_DEVICE_TYPE': 'Device',
        'EQUIPMENT_CAM_AND_MIC_PRESENT': 'Camera and microphone present?',
        'EQUIPMENT_BROWSER': 'Browser',
        'EQUIPMENT_BANDWIDTH': 'Internet speed',
        'EQUIPMENT_SAME_DEVICE': 'Is the same computer you would use?',
        'OTHER_INFORMATION': 'Is there anything else you would like to draw to the court\'s attention?',
        'EQUIPMENT_INTERNET': 'On the day of the hearing, will you have access to an internet connection?',
        'EQUIPMENT_LAPTOP': 'On the day of the hearing, will you have access to a laptop?',
        'EQUIPMENT_COMPUTER_CAMERA': 'On the day of the hearing, will you have access to a computer with a camera?',
    },
    Citizen: {
        'ANY_OTHER_CIRCUMSTANCES': 'Is there anything the court should be aware of when it decides which type of hearing will be suitable?',
        'SUITABLE_ROOM_AVAILABLE': 'On the day of your hearing, will you have acces to a suitable room?',
        'USER_CONSENT': 'Your consent for a video hearing',
        'NEED_INTERPRETER': 'Will you need an interpreter for your hearing?',
        'EQUIPMENT_PHONE': 'On the day of the hearing, will you have access to a phone?',
        'EQUIPMENT_INTERNET': 'On the day of the hearing, will you have access to an internet connection?',
        'EQUIPMENT_LAPTOP': 'On the day of the hearing, will you have access to a laptop?',
        'EQUIPMENT_COMPUTER_CAMERA': 'On the day of the hearing, will you have access to a computer with a camera?'
    }
};
