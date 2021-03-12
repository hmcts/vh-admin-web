import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PipeStringifierService {

  constructor() { }

  encode<T>(input: T): string {
    let output = '';
    for (var property in input) {
      if (Object.prototype.hasOwnProperty.call(input, property)) {
        output += `|${property}|${input[property]}`;
      }
    }
    return output;
  }

  decode<T>(input: string): T {
    let output = {};
    const keyValuePairs = input.match(/[^|]+\|[^|]+/g)
    keyValuePairs.forEach(property => {
      const pair = property.split('|');
      output[pair[0]] = pair[1];
    });
    return output as T;
  }
}
