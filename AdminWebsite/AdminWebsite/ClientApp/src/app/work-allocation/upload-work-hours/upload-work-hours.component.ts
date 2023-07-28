import { Component } from '@angular/core';
import { FileType } from '../../common/model/file-type';
import { WorkHoursFileProcessorService } from '../services/work-hours-file-processor.service';

@Component({
    selector: 'app-upload-work-hours',
    templateUrl: './upload-work-hours.component.html'
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
    public disableNonWorkHoursButton: boolean;
    public disableWorkHoursButton: boolean;

    constructor(private workHoursProcessor: WorkHoursFileProcessorService) {}

    handleFileInput(file: File, fileType: FileType) {
        if (!file) {
            this.handleFileInputCancel(fileType);
            return;
        }

        if (!this.workHoursProcessor.isFileFormatValild(file)) {
            const message = `File format is not supported, Supported file format is .CSV`;
            this.handleFileInputError(fileType, message);
            return;
        } else {
            this.reenableUploadButton(fileType);
        }

        if (this.workHoursProcessor.isFileTooBig(file)) {
            const message = `File cannot be larger than ${this.workHoursProcessor.maxFileUploadSize / 1000}kb`;
            this.handleFileInputError(fileType, message);
            return;
        } else {
            this.reenableUploadButton(fileType);
        }

        if (fileType === FileType.UploadWorkingHours) {
            this.resetWorkingHoursMessages();
            this.workingHoursFile = file;
        } else {
            this.resetNonWorkingHoursMessages();
            this.nonWorkingHoursFile = file;
        }
    }

    handleFileInputCancel(fileType: FileType) {
        if (fileType === FileType.UploadWorkingHours) {
            this.resetWorkingHoursMessages();
        } else {
            this.resetNonWorkingHoursMessages();
        }
    }

    resetWorkingHoursMessages() {
        this.workingHoursFileValidationErrors = [];
        this.isWorkingHoursUploadComplete = false;
    }

    resetNonWorkingHoursMessages() {
        this.nonWorkingHoursFileValidationErrors = [];
        this.isNonWorkingHoursUploadComplete = false;
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
        this.resetWorkingHoursMessages();

        if (!this.workingHoursFile) {
            return;
        }

        const reader = this.readFile(this.workingHoursFile);
        reader.onload = e => this.readWorkAvailability(e.target.result as string);
    }

    uploadNonWorkingHours() {
        this.resetNonWorkingHoursMessages();

        if (!this.nonWorkingHoursFile) {
            return;
        }

        const reader = this.readFile(this.nonWorkingHoursFile);
        reader.onload = e => this.readNonWorkAvailability(e.target.result as string);
    }

    private handleFileInputError(fileType: FileType, message: string) {
        if (fileType === FileType.UploadNonWorkingHours) {
            this.disableNonWorkHoursButton = true;
            this.resetNonWorkingHoursMessages();
            this.nonWorkingHoursFileValidationErrors.push(message);
        } else {
            this.disableWorkHoursButton = true;
            this.resetWorkingHoursMessages();
            this.workingHoursFileValidationErrors.push(message);
        }
    }

    private reenableUploadButton(fileType: FileType) {
        if (fileType === FileType.UploadWorkingHours) {
            this.disableWorkHoursButton = false;
        } else {
            this.disableNonWorkHoursButton = false;
        }
    }
}
