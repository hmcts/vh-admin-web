export class ParticipantModel {
  id?: string | undefined;
  title?: string | undefined;
  first_name?: string | undefined;
  last_name?: string | undefined;
  middle_names?: string | undefined;
  display_name?: string | undefined;
  username?: string | undefined;
  email?: string | undefined;
  case_role_name?: string | undefined;
  hearing_role_name?: string | undefined;
  phone?: string | undefined;
  reference?: string | undefined;
  representee?: string | undefined;
  company?: string | undefined;
  is_judge: boolean;
  is_exist_person: boolean;
  housenumber?: string | undefined;
  street?: string | undefined;
  city?: string | undefined;
  county?: string | undefined;
  postcode?: string | undefined;

  get isRepresenting() {
    return this.hearing_role_name && this.hearing_role_name.indexOf('Representative') > -1
      && this.representee && this.representee.length > 0;
  }
}
