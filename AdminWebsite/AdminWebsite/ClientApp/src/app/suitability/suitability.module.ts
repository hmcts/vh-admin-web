import { QuestionnaireService } from './services/questionnaire.service';
import { AnswersListComponent } from './answers-list/answers-list.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { VhOfficerAdminGuard } from '../security/vh-officer-admin.guard';
import { AnswerListEntryComponent } from './answer-list-entry/answer-list-entry.component';

export const routes: Routes = [
  { path: 'checklists', component: AnswersListComponent, canActivate: [VhOfficerAdminGuard] },
];

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forRoot(routes),
  ],
  providers: [
    QuestionnaireService
  ],
  exports: [
    RouterModule
  ],
  declarations: [AnswersListComponent, AnswerListEntryComponent]
})
export class SuitabilityModule { }
