import {Component, Input, Output, EventEmitter, NgModule} from '@angular/core';

@Component({ selector: 'app-remove-popup', template: '' })
export class RemovePopupStubComponent {
  @Output() continueRemove: EventEmitter<any> = new EventEmitter<any>();

  @Output() cancelRemove: EventEmitter<any> = new EventEmitter<any>();

  @Input() fullName: string;
}

@NgModule({
  declarations: [
    RemovePopupStubComponent
  ]
})
export class RemovePopupStubModule {}
