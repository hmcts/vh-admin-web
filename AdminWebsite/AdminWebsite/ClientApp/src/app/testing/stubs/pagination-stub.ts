import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from 'events';
import { PaginationModel } from 'src/app/shared/pagination/pagination-model';

@Component({ selector: 'app-pagination', template: '' })
export class PaginationStubComponent {
    @Input() pagination: PaginationModel = new PaginationModel(0, 1, 1, 5);

    @Output() moveToStart$ = new EventEmitter();
    @Output() moveToEnd$ = new EventEmitter();
    @Output() moveNext$ = new EventEmitter();
    @Output() movePrevious$ = new EventEmitter();
}
