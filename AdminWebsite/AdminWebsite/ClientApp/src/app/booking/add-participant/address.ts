export class Address {

  houseNumber: string;
  street: string;
  city: string;
  county: string;
  postcode: string;

  setDummyAddress() {
    this.houseNumber = '123';
    this.street = 'London Road';
    this.city = 'London';
    this.county = 'London';
    this.postcode = 'SW1 1WS';
  }
}
