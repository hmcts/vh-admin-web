import { Component, OnInit } from '@angular/core';
import { parse } from 'papaparse';
import { RefDataRowItem } from '../models/ref-data.model';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { InterprepretationType } from 'src/app/services/clients/api-client';
import { map } from 'rxjs';

type LanguageStatus = 'New' | 'Removed' | 'Modified' | 'Unchanged';
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
    existingDbLanguages: AvailableLanguage[];
    proposedCsvLanguages: RefDataRowItem[] = [];
    data: LanguageComparisonResult[] = [];

    languageStatuses: LanguageStatus[] = ['New', 'Removed', 'Modified', 'Unchanged'];
    selectedStatus: LanguageStatus | string = 'all';

    fileProcessed = false;
    duplicateCodeDetected = false;

    constructor(private refDataService: ReferenceDataService) {}

    get unchangedLanguages() {
        return this.data.filter(x => x.status === 'Unchanged');
    }

    get newLanguages() {
        return this.data.filter(x => x.status === 'New');
    }

    get modifiedLanguages() {
        return this.data.filter(x => x.status === 'Modified');
    }

    get removedLanguages() {
        return this.data.filter(x => x.status === 'Removed');
    }

    get filteredData() {
        if (!this.selectedStatus) {
            return this.data;
        }
        if (this.selectedStatus === 'all') {
            return this.data;
        }
        return this.data.filter(item => item.status === this.selectedStatus);
    }

    ngOnInit() {
        this.refDataService
            .getAvailableInterpreterLanguages()
            .pipe(
                map(data => {
                    return data.map(lang => {
                        return {
                            code: lang.code,
                            description: lang.description,
                            descriptionWelsh: lang.description_welsh,
                            type: lang.type
                        };
                    });
                })
            )
            .subscribe(data => {
                this.existingDbLanguages = data;
            });
    }

    onFileSelected($event: Event) {
        const file = ($event.target as HTMLInputElement).files[0];
        this.file = file;
        this.fileName = file?.name;
    }

    uploadFile() {
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
        this.duplicateCodeDetected =
            this.proposedCsvLanguages.length !==
            this.proposedCsvLanguages.map(x => x.Key).filter((value, index, self) => self.indexOf(value) === index).length;
        this.fileProcessed = true;
    }

    compareLanguages(proposedLanguages: RefDataRowItem[], currentLanguages: AvailableLanguage[]): LanguageComparisonResult[] {
        const comparisonResult: LanguageComparisonResult[] = [];

        const currentLanguageCodes = currentLanguages.map(lang => lang.code);

        // Check for removed, modified, and unchanged languages
        for (const proposedLanguage of proposedLanguages) {
            const currentLanguage = currentLanguages.find(lang => lang.code === proposedLanguage.Key);

            if (!currentLanguage) {
                const type = proposedLanguage.CategoryKey === 'SignLanguage' ? InterprepretationType.Sign : InterprepretationType.Verbal;
                comparisonResult.push({
                    language: {
                        code: proposedLanguage.Key,
                        description: proposedLanguage.Value_EN,
                        descriptionWelsh: proposedLanguage.Value_CY,
                        type: type
                    },
                    status: 'New'
                });
            } else if (!proposedLanguage.Active) {
                comparisonResult.push({
                    language: {
                        code: proposedLanguage.Key,
                        description: proposedLanguage.Value_EN,
                        descriptionWelsh: proposedLanguage.Value_CY,
                        type: currentLanguage.type
                    },
                    status: 'Removed'
                });
            } else if (proposedLanguage.Value_EN !== currentLanguage.description) {
                comparisonResult.push({
                    language: {
                        code: proposedLanguage.Key,
                        description: proposedLanguage.Value_EN,
                        descriptionWelsh: proposedLanguage.Value_CY,
                        type: currentLanguage.type
                    },
                    status: 'Modified'
                });
            } else {
                comparisonResult.push({
                    language: {
                        code: proposedLanguage.Key,
                        description: proposedLanguage.Value_EN,
                        descriptionWelsh: proposedLanguage.Value_CY,
                        type: currentLanguage.type
                    },
                    status: 'Unchanged'
                });
            }
        }

        // Check for removed languages in currentLanguages
        for (const currentLanguage of currentLanguages) {
            if (!proposedLanguages.map(lang => lang.Key).includes(currentLanguage.code)) {
                comparisonResult.push({
                    language: currentLanguage,
                    status: 'Removed'
                });
            }
        }

        return comparisonResult;
    }

    generateMigrationScript() {
        let sql = '';
        for (const language of this.data) {
            sql += this.getUpsertSql(language);
        }

        // write the sql to a file for the user to download
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(sql));
        element.setAttribute('download', 'migration.sql');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        element.remove();
    }

    private getUpsertSql(result: LanguageComparisonResult): string {
        const code = result.language.code;
        const description = result.language.description;
        const descriptionWelsh = result.language.descriptionWelsh;
        const active = result.status !== 'Removed' ? 1 : 0;
        const type = result.language.type === InterprepretationType.Sign ? 1 : 2; // sign = 1, verbal = 2

        const sql = `MERGE INTO InterpreterLanguage AS Target
        USING (VALUES ('${code}', '${description}', '${descriptionWelsh}', ${active}, ${type})) 
        AS Source (Code, Value, WelshValue, Live, Type)
        ON Target.Code = Source.Code
        WHEN MATCHED THEN
            UPDATE SET Value = Source.Value, WelshValue = Source.WelshValue, Live = Source.Live, Type = Source.Type, UpdatedDate = GETDATE()
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (Code, Value, WelshValue, Type, Live, CreatedDate, UpdatedDate) VALUES (Source.Code, Source.Value, Source.WelshValue, Source.Type,  Source.Live, GETDATE(), GETDATE());`;

        return sql;
    }
}

export interface AvailableLanguage {
    code: string | undefined;
    description: string | undefined;
    descriptionWelsh: string | undefined;
    type: InterprepretationType;
}
