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
  AboutYou: 'ABOUT_YOU',
  AboutYourClient: 'ABOUT_YOUR_CLIENT',
  ClientAttendance: 'CLIENT_ATTENDANCE',
  HearingSuitability: 'HEARING_SUITABILITY',
  Room: 'ROOM',
  Camera: 'CAMERA_MICROPHONE',
  Computer: 'COMPUTER'
};

export const SelfTestQuestionKeys = {
  SeeYourself: 'SEE_YOURSELF',
  Speakers: 'SPEAKERS',
  SeeHearClearly: 'SEE_HEAR_CLEARLY'
};

export interface QuestionsMapAttributes {
  QuestionsOrder: string[];
  Questions: Map<string, string>;
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

  public readonly Questions = new Map<string, string>([
    [IndividualQuestionKeys.AboutYou,
      'Is there anything you\'d like the court to take into account when it decides which type of hearing will be suitable?'
    ],
    [IndividualQuestionKeys.Interpreter, 'Will you need an interpreter for your hearing?'],
    [IndividualQuestionKeys.Computer, 'Will you have access to a laptop or desktop computer (not a mobile, not a tablet)?'],
    [IndividualQuestionKeys.Camera, 'Does your computer have a camera and microphone?'],
    [IndividualQuestionKeys.Internet, 'At the time of your hearing, will the computer be able to access the internet?'],
    [IndividualQuestionKeys.Room, 'At the time of your hearing, will you have access to a quiet, private room?'],
    [IndividualQuestionKeys.Consent, 'Would you be content to take part in your hearing by video?']
  ]);
}

export class RepresentativeQuestionsMapAttributes implements QuestionsMapAttributes {
  public readonly QuestionsOrder = [
    RepresentativeQuestionKeys.AboutYou,
    RepresentativeQuestionKeys.Room,
    RepresentativeQuestionKeys.Computer,
    RepresentativeQuestionKeys.Camera,
    RepresentativeQuestionKeys.AboutYourClient,
    RepresentativeQuestionKeys.ClientAttendance,
    RepresentativeQuestionKeys.HearingSuitability
  ];

  public readonly Questions = new Map<string, string>([
    [RepresentativeQuestionKeys.AboutYou, 'Is there anything that could affect your ability to take part in a video hearing?'],
    [RepresentativeQuestionKeys.Room,
      'Will you have access to a quiet, private room where you can connect to the internet and where your client can sit with you?'],
    [RepresentativeQuestionKeys.Computer, 'Will you have access to a laptop or desktop computer (not a mobile, not a tablet)?'],
    [RepresentativeQuestionKeys.Camera, 'Does your computer have a camera and microphone?'],
    [RepresentativeQuestionKeys.AboutYourClient,
      'Is there anything that could affect your client\'s ability to take part in a video hearing?'],
    [RepresentativeQuestionKeys.ClientAttendance, 'Will your client be attending the hearing?'],
    [RepresentativeQuestionKeys.HearingSuitability, 'Is there anything about this case you think makes it unsuitable for a video hearing?']
  ]);
}

export class SelfTestQuestionsMapAttributes implements QuestionsMapAttributes {

   public readonly QuestionsOrder = [
    SelfTestQuestionKeys.SeeYourself,
    SelfTestQuestionKeys.Speakers,
    SelfTestQuestionKeys.SeeHearClearly,
  ];

  public readonly Questions = new Map<string, string>([
    [SelfTestQuestionKeys.SeeYourself, 'Could you see yourself on the screen in the camera window?'],
    [SelfTestQuestionKeys.Speakers, 'Could you see the bar moving when you spoke?'],
    [SelfTestQuestionKeys.SeeHearClearly, 'Could you see and hear the video clearly?']
  ]);
  }
