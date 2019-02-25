export class ParticipantDetailsModel {
  constructor(participantId: number, title: string, firstName: string, lastName: string,
    role: string, userName: string, email: string) {
    this.ParticipantId = participantId;
    this.FirstName = firstName;
    this.LastName = lastName;
    this.Title = title;
    this.Role = role;
    this.UserName = userName;
    this.Flag = false;
    this.Email = email;
  }

  ParticipantId: number;
  Title: string;
  FirstName: string;
  LastName: string;
  Role: string;
  UserName: string;
  Email: string;

  //flag to indicate if participant is the last in the list and don't need decoration bottom line
  Flag: boolean

  get fullName(): string {
    return `${this.Title} ${this.FirstName} ${this.LastName}`;
  }
}