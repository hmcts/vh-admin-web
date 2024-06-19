import { Component, OnInit } from '@angular/core';
import { parse } from 'papaparse';
import { RefDataRowItem } from '../models/ref-data.model';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { AvailableLanguageResponse } from 'src/app/services/clients/api-client';

type LanguageStatus = 'new' | 'removed' | 'modified' | 'unchanged';
interface LanguageComparisonResult {
    language: AvailableLanguage;
    status: LanguageStatus;
}

@Component({
    selector: 'app-languages',
    templateUrl: './languages.component.html',
    styleUrl: './languages.component.scss'
})
export class LanguagesComponent implements OnInit {
    fileName = '';
    file;
    existingDbLanguages: AvailableLanguageResponse[];
    proposedCsvLanguages: RefDataRowItem[] = [];
    data: LanguageComparisonResult[] = [];

    constructor(private refDataService: ReferenceDataService) {}

    get unchangedLanguages() {
        return this.data.filter(x => x.status === 'unchanged');
    }

    get newLanguages() {
        return this.data.filter(x => x.status === 'new');
    }

    get modifiedLanguages() {
        return this.data.filter(x => x.status === 'modified');
    }

    get removedLanguages() {
        return this.data.filter(x => x.status === 'removed');
    }

    ngOnInit() {
        this.refDataService.getAvailableInterpreterLanguages().subscribe(data => {
            this.existingDbLanguages = data;
        });
    }

    onFileSelected($event: Event) {
        const file = ($event.target as HTMLInputElement).files[0];
        this.file = file;
        this.fileName = file?.name;
    }

    uploadFile() {
        console.log('Uploading file...');
        const reader = new FileReader();

        const self = this;
        reader.onload = e => {
            self.mapCsvToDtos(e.target.result);
        };
        reader.readAsText(this.file);
    }

    mapCsvToDtos(result: string | ArrayBuffer) {
        const results = parse(result, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim()
        });

        const refDataRows: RefDataRowItem[] = results.data.map(row => ({
            CategoryKey: row.CategoryKey,
            ServiceID: row.ServiceID,
            Key: row.Key,
            Value_EN: row.Value_EN,
            Value_CY: row.Value_CY,
            Hinttext_EN: row.Hinttext_EN,
            Hinttext_CY: row.Hinttext_CY,
            Lov_Order: Number(row.Lov_Order),
            ParentCategory: row.ParentCategory,
            ParentKey: row.ParentKey,
            Active: row.Active === 'Y' || row.Active === 'y'
        }));
        const signLanguages = refDataRows.filter(x => x.CategoryKey === 'SignLanguage');
        const spokenLanguages = refDataRows.filter(x => x.CategoryKey === 'InterpreterLanguage');
        this.proposedCsvLanguages = [...signLanguages, ...spokenLanguages];

        this.data = this.compareLanguages(this.proposedCsvLanguages, this.existingDbLanguages);
        console.log(this.data);
    }

    compareLanguages(proposedLanguages: RefDataRowItem[], currentLanguages: AvailableLanguageResponse[]): LanguageComparisonResult[] {
        const comparisonResult: LanguageComparisonResult[] = [];

        const currentLanguageCodes = currentLanguages.map(lang => lang.code);

        // Check for removed, modified, and unchanged languages
        for (const proposedLanguage of proposedLanguages) {
            const currentLanguage = currentLanguages.find(lang => lang.code === proposedLanguage.Key);

            if (!currentLanguage) {
                comparisonResult.push({ language: { code: proposedLanguage.Key, description: proposedLanguage.Value_EN }, status: 'new' });
            } else if (!proposedLanguage.Active) {
                comparisonResult.push({
                    language: { code: proposedLanguage.Key, description: proposedLanguage.Value_EN },
                    status: 'removed'
                });
            } else if (proposedLanguage.Value_EN !== currentLanguage.description) {
                comparisonResult.push({
                    language: { code: proposedLanguage.Key, description: proposedLanguage.Value_EN },
                    status: 'modified'
                });
            } else {
                comparisonResult.push({
                    language: { code: proposedLanguage.Key, description: proposedLanguage.Value_EN },
                    status: 'unchanged'
                });
            }
        }

        // Check for removed languages in currentLanguages
        for (const currentLanguage of currentLanguages) {
            if (!proposedLanguages.map(lang => lang.Key).includes(currentLanguage.code)) {
                comparisonResult.push({ language: currentLanguage, status: 'removed' });
            }
        }

        return comparisonResult;
    }

    // compareLanguages(proposedLanguages: RefDataRowItem[], currentLanguages: AvailableLanguageResponse[]): LanguageComparisonResult[] {
    //     const comparisonResult: LanguageComparisonResult[] = [];

    //     const currentLanguageKeys = proposedLanguages.map(lang => lang.Key);
    //     const proposedLanguageCodes = currentLanguages.map(lang => lang.code);

    //     // Check for new and modified languages
    //     for (const currentLanguage of currentLanguages) {
    //         if (!currentLanguageKeys.includes(currentLanguage.code)) {
    //             comparisonResult.push({ language: currentLanguage, status: 'removed' });
    //         } else {
    //             const currentLanguage = proposedLanguages.find(lang => lang.Key === currentLanguage.code);
    //             if (currentLanguage.Value_EN !== currentLanguage.description) {
    //                 comparisonResult.push({ language: currentLanguage, status: 'modified' });
    //             } else {
    //                 comparisonResult.push({ language: currentLanguage, status: 'unchanged' });
    //             }
    //         }
    //     }

    //     // Check for new languages
    //     for (const currentLanguage of proposedLanguages) {
    //         if (!proposedLanguageCodes.includes(currentLanguage.Key)) {
    //             comparisonResult.push({
    //                 language: { code: currentLanguage.Key, description: currentLanguage.Value_EN },
    //                 status: 'new'
    //             });
    //         }
    //     }

    //     return comparisonResult;
    // }
}

export interface AvailableLanguage extends Omit<AvailableLanguageResponse, 'init' | 'toJSON'> {}
