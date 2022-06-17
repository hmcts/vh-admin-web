import { QuestionnaireApiService } from './services/questionnaire-api.service';
import { QuestionnaireService } from './services/questionnaire.service';
import { AnswersListComponent } from './answers-list/answers-list.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AnswerListEntryComponent } from './answer-list-entry/answer-list-entry.component';
import { ScrollableSuitabilityAnswersService } from './services/scrollable-suitability-answers.service';
import { QuestionnaireMapperFactory } from './services/questionnaire-mapper-factory.service';

export const routes: Routes = [
    {
        path: 'questionnaire',
        redirectTo: 'dashboard' // component: AnswersListComponent,
        // canActivate: [VhOfficerAdminGuard] /*no longer in use*/
    }
];

@NgModule({
    imports: [SharedModule, CommonModule, RouterModule.forRoot(routes)],
    providers: [
        QuestionnaireService,
        { provide: ScrollableSuitabilityAnswersService, useClass: QuestionnaireApiService },
        QuestionnaireMapperFactory
    ],
    exports: [RouterModule],
    declarations: [AnswersListComponent, AnswerListEntryComponent]
})
export class SuitabilityModule {}
