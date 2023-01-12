import { Component } from '@angular/core';
import { FileType } from '../../common/model/file-type';
import { WorkHoursFileProcessorService } from '../services/work-hours-file-processor.service';

@Component({
    selector: 'app-upload-work-hours',
    templateUrl: './upload-work-hours.component.html',
    styleUrls: ['./upload-work-hours.component.scss']
})
export class UploadWorkHoursComponent {
    public fileType = FileType;
    public isWorkingHoursUploadComplete = false;
    public isNonWorkingHoursUploadComplete = false;

    public numberOfUsernamesToUploadWorkHours = 0;
    public numberOfUsernamesToUploadNonWorkHours = 0;

    public nonWorkingHoursFileUploadUsernameErrors: string[] = [];
    public nonWorkingHoursFileValidationErrors: string[] = [];

    public workingHoursFileUploadUsernameErrors: string[] = [];
    public workingHoursFileValidationErrors: string[] = [];

    public workingHoursFile: File | null = null;
    public nonWorkingHoursFile: File | null = null;

    constructor(private workHoursProcessor: WorkHoursFileProcessorService) {}

    handleFileInput(file: File, fileType: FileType) {
        this.resetProgress();
        this.resetErrors();

        if (!file) {
            return;
        }

        if (this.workHoursProcessor.isFileTooBig(file)) {
            if (fileType === FileType.UploadNonWorkingHours) {
                this.nonWorkingHoursFileValidationErrors.push(
                    `File cannot be larger than ${this.workHoursProcessor.maxFileUploadSize / 1000}kb`
                );
            } else {
                this.workingHoursFileValidationErrors.push(
                    `File cannot be larger than ${this.workHoursProcessor.maxFileUploadSize / 1000}kb`
                );
            }
        }

        if (fileType === FileType.UploadWorkingHours) {
            this.workingHoursFile = file;
        } else {
            this.nonWorkingHoursFile = file;
        }
    }

    resetErrors() {
        this.nonWorkingHoursFileValidationErrors = [];
        this.workingHoursFileValidationErrors = [];
    }

    resetProgress() {
        this.isWorkingHoursUploadComplete = this.isNonWorkingHoursUploadComplete = false;
    }

    readFile(file: File): FileReader {
        const reader = new FileReader();
        reader.readAsText(file);
        return reader;
    }

    readWorkAvailability(text: string) {
        this.isWorkingHoursUploadComplete = false;

        const workingHoursResult = this.workHoursProcessor.processWorkHours(text);

        this.numberOfUsernamesToUploadWorkHours = workingHoursResult.numberOfUserNameToUpload;
        const workAvailabilities = workingHoursResult.uploadWorkHoursRequest;
        this.workingHoursFileValidationErrors = workingHoursResult.fileValidationErrors;

        if (this.workingHoursFileValidationErrors.length > 0) {
            return;
        }

        this.workHoursProcessor.uploadWorkingHours(workAvailabilities).subscribe(result => {
            this.isWorkingHoursUploadComplete = true;
            this.workingHoursFileUploadUsernameErrors = result.failed_usernames;
        });
    }

    readNonWorkAvailability(text: string) {
        this.isNonWorkingHoursUploadComplete = false;

        const nonWorkingHoursResult = this.workHoursProcessor.processNonWorkHours(text);

        this.numberOfUsernamesToUploadNonWorkHours = nonWorkingHoursResult.numberOfUserNameToUpload;
        const uploadNonWorkHoursRequests = nonWorkingHoursResult.uploadNonWorkHoursRequest;
        this.nonWorkingHoursFileValidationErrors = nonWorkingHoursResult.fileValidationErrors;

        if (this.nonWorkingHoursFileValidationErrors.length > 0) {
            return;
        }

        this.workHoursProcessor.uploadNonWorkingHours(uploadNonWorkHoursRequests).subscribe(result => {
            this.isNonWorkingHoursUploadComplete = true;
            this.nonWorkingHoursFileUploadUsernameErrors = result.failed_usernames;
        });
    }

    uploadWorkingHours() {
        this.resetErrors();

        if (!this.workingHoursFile) {
            return;
        }

        const reader = this.readFile(this.workingHoursFile);
        reader.onload = e => this.readWorkAvailability(e.target.result as string);
    }

    uploadNonWorkingHours() {
        this.resetErrors();

        if (!this.nonWorkingHoursFile) {
            return;
        }

        const reader = this.readFile(this.nonWorkingHoursFile);
        reader.onload = e => this.readNonWorkAvailability(e.target.result as string);
    }
}
