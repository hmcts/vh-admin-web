import { Component, OnInit } from '@angular/core';
import { parse } from 'papaparse';
import { RefDataRowItem } from '../models/ref-data.model';

@Component({
    selector: 'app-languages',
    templateUrl: './languages.component.html',
    styleUrl: './languages.component.scss'
})
export class LanguagesComponent implements OnInit {
    fileName = '';
    file;
    signLanguages: RefDataRowItem[];
    spokenLanguages: RefDataRowItem[];

    constructor() {}

    ngOnInit() {}

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
        this.signLanguages = refDataRows.filter(x => x.CategoryKey === 'SignLanguage');
        this.spokenLanguages = refDataRows.filter(x => x.CategoryKey === 'InterpreterLanguage');

        console.log('SignLanguages:', this.signLanguages);
        console.log('SpokenLanguages', this.spokenLanguages);
    }
}
