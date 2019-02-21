import { ChecklistModel, AnswerQuestion } from 'src/app/common/model/checklist.model';

export class ChecklistTestData {

    getTestData(): Array<ChecklistModel> {
        const checklistsTest: Array<ChecklistModel> = [];
        const chm1 = new ChecklistModel(1, 'Mrs', 'Stive', 'Smith', 'Hr1', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm2 = new ChecklistModel(2, 'Mrs', 'Stive', 'Smith', 'Hr2', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm3 = new ChecklistModel(3, 'Mrs', 'Stive', 'Smith', 'Hr3', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));

        const chm4 = new ChecklistModel(1, 'Mrs', 'Stive', 'Smith', 'Hr4', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm5 = new ChecklistModel(2, 'Mrs', 'Stive', 'Smith', 'Hr5', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm6 = new ChecklistModel(3, 'Mrs', 'Stive', 'Smith', 'Hr6', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));

        const chm7 = new ChecklistModel(1, 'Mrs', 'Stive', 'Smith', 'Hr7', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm8 = new ChecklistModel(2, 'Mrs', 'Stive', 'Smith', 'Hr8', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.37);30067'));
        const chm9 = new ChecklistModel(3, 'Mrs', 'Stive', 'Smith', 'Hr9', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));

        const chm10 = new ChecklistModel(1, 'Mrs', 'Stive', 'Smith', 'Hr10', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm11 = new ChecklistModel(2, 'Mrs', 'Stive', 'Smith', 'Hr11', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));
        const chm12 = new ChecklistModel(3, 'Mrs', 'Stive', 'Smith', 'Hr12', 'Mr Smith vs Mr Roy', new Date('2018-10-22 13:58:40.3730067'));

        const answer1 = new AnswerQuestion('EQUIPMENT_BANDWIDTH', 'Download 123Mbs, upload 12MBs', 'Citizen');
        answer1.Notes = 'Very very long long notes. Very very long long notes.Very very long long notes.';
        const answer2 = new AnswerQuestion('EQUIPMENT_SAME_DEVICE', 'Yes', 'Citizen');
        const answer3 = new AnswerQuestion('EQUIPMENT_DEVICE_TYPE', 'Desktop', 'Citizen');
        const answer4 = new AnswerQuestion('EQUIPMENT_BROWSER', 'Safari', 'Citizen');
        const answer5 = new AnswerQuestion('EQUIPMENT_CAM_AND_MIC_PRESENT', 'Camera and microphone present', 'Citizen');
        const answerList = [answer1, answer2, answer3, answer4, answer5];
        chm1.Answers = answerList;
        chm2.Answers = answerList;
        chm3.Answers = answerList;
        checklistsTest.push(chm1);
        checklistsTest.push(chm2);
        checklistsTest.push(chm3);
        checklistsTest.push(chm4);
        checklistsTest.push(chm5);
        checklistsTest.push(chm6);
        checklistsTest.push(chm7);
        checklistsTest.push(chm8);
        checklistsTest.push(chm9);
        checklistsTest.push(chm10);
        checklistsTest.push(chm11);
        checklistsTest.push(chm12);
        return checklistsTest;
    }
}
