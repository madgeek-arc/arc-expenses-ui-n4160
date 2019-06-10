import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Stage } from '../domain/operation';
import { commentDesc, FieldDescription } from '../domain/stageDescriptions';
import { DatePipe } from '@angular/common';
import { RequestInfo, StageInfo } from '../domain/requestInfoClasses';

declare var UIkit: any;

@Component ({
    selector: 'stage-component',
    template: ``
})
export class StageComponent implements OnInit {
    @Input() data: any;

    stageFormError: string;

    /* output variable that sends the new Stage back to the parent component
     * in order to call the api and update the request */
    @Output() emitStage: EventEmitter<any[]> = new EventEmitter<any[]>();

    updateMode: string; /* approve, reject, downgrade or edit */

    /* input variable that defines the status of the current stage */
    @Input() showStage: number; /* values:  0 -> don't show
                                            1 -> show form
                                            2 -> was approved
                                            3 -> was rejected
                                            4 -> was returned to previous*/

    @Output() newValues: EventEmitter<string[]> = new EventEmitter<string[]>();
    @Output() promptEdit: EventEmitter<boolean> = new EventEmitter<boolean>();


    /*  phrase mentioning the result of a submitted stage
        it changes according to stage */
    submittedStageResult: string;

    stageForm: FormGroup;
    stageFormDefinition; /*will contain the form schema*/
    commentFieldDesc: FieldDescription = commentDesc;

    stageTitle: string;
    stageId: string;
    stageFields: FieldDescription[];

    uploadedFiles: File[] = [];
    uploadedFilenames: string[] = [];
    filesToBeDeleted: string[] = [];

    currentStage: Stage;
    currentRequestInfo: RequestInfo;
    currentStageInfo: StageInfo;

    canEditStage: boolean; // true when this stage was the last to be submitted amd it can be edited by the current user

    datePipe = new DatePipe('el');

    constructor(private fb: FormBuilder) {}

    ngOnInit() {

        this.parseData();

        if ( (this.stageId != null) && (this.currentRequestInfo != null) ) {

            this.currentStageInfo = this.currentRequestInfo[this.stageId];
            this.showStage = this.currentStageInfo.showStage;
            this.stageTitle = this.currentStageInfo.title;
            this.stageFields = this.currentStageInfo.stageFields;
            this.canEditStage = ((this.currentRequestInfo.previousStage != null) &&
                                 (this.stageId === this.currentRequestInfo.previousStage));
            if (this.showStage > 1) {
                this.submittedStageResult = this.currentStageInfo.submittedStageResultMap[this.showStage.toString()];
            }

            this.initializeView();
        }
    }

    parseData() {
        if ( this.data ) {
            this.currentStage = this.data['currentStage'];
            this.currentRequestInfo = this.data['currentRequestInfo'];
        }
    }

    initializeView() {
        if (this.showStage === 1) {

            /* set filename if exists */
            if ( this.currentStage.attachments ) {
                for (const f of this.currentStage.attachments) {
                    this.uploadedFilenames.push(f.filename);
                }
            }

            /* create form */
            this.stageForm = this.fb.group(this.stageFormDefinition);

            /* fill the form if the values exist */
            Object.keys(this.stageForm.controls).forEach(key => {
                if ( this.currentStage[key.toString()] ) {
                    this.stageForm.get(key).setValue(this.currentStage[key.toString()]);
                }
            });
        }
    }

    linkToFile(i: number) {
        if (this.currentStage.attachments &&
            this.currentStage.attachments[i] &&
            this.currentStage.attachments[i].url) {

            const mode: string = (this.currentRequestInfo.phaseId.includes('a') ? 'approval' : 'payment');

            let url = `${window.location.origin}/arc-expenses-service/request/store?`;
            url = `${url}archiveId=${encodeURIComponent(this.currentStage.attachments[i].url)}`;
            url = `${url}&id=${this.currentRequestInfo.phaseId}`;
            url = `${url}&mode=${mode}`;

            /* link to download method */
            window.open(url, '_blank');
        }
    }

    getAttachmentsInput(newFiles: File[]) {
        this.stageFormError = '';
        this.uploadedFiles = newFiles;
        console.log(`${this.uploadedFiles.length} files were chosen`);
    }

    removeUploadedFile(filename: string) {
        const z = this.uploadedFilenames.indexOf(filename);
        this.uploadedFilenames.splice(z, 1);

        // if it was a new file
        if (this.uploadedFiles && this.uploadedFiles.some(x => x.name === filename)) {
            const i = this.uploadedFiles.findIndex(x => x.name === filename);
            this.uploadedFiles.splice(i, 1);

        // if it was an already uploaded file
        } else  if (this.currentStage.attachments &&
                    this.currentStage.attachments.some(x => x.filename === filename)) {

            const i = this.currentStage.attachments.findIndex(x => x.filename === filename);
            this.filesToBeDeleted.push(this.currentStage.attachments[i].url);
            this.currentStage.attachments.splice(i, 1);
        }
    }

    editStage(showForm: boolean) {
        this.promptEdit.emit(showForm);
    }

    approveRequest( approved: boolean ) {
        console.log('approved is:', approved);
        if (!approved) {
            Object.keys(this.stageForm.controls).forEach(key => {
                this.stageForm.get(key).clearValidators();
                this.stageForm.get(key).updateValueAndValidity();
            });
            this.updateMode = 'reject';
            // UIkit.modal('#rejectionModal' + this.stageId).hide();
        } else {
            this.updateMode = 'approve';
        }

        if ((this.stageId !== '6') && (this.stageId !== '11')) {
            this.currentStage['approved'] = approved;
        }

        this.submitForm();

    }

    goBackOneStage() {
        this.stageFormError = '';
        if ( !this.stageForm.get('comment').value ) {
            this.stageFormError = 'Είναι υποχρεωτικό να γράψετε ένα σχόλιο για την επιλογή σας.';
        } else {
            Object.keys(this.stageForm.controls).forEach(key => {
                this.stageForm.get(key).clearValidators();
                this.stageForm.get(key).updateValueAndValidity();
            });
            this.updateMode = 'downgrade';

            this.submitForm();

        }
    }

    resubmitPreviousStage() {
        this.updateMode = 'edit';

        this.submitForm();

    }

    submitForm() {
        this.stageFormError = '';
        if (this.stageForm && this.stageForm.valid ) {
            if ( ((this.updateMode === 'approve') || (this.updateMode === 'edit')) &&
                 ( ((this.uploadedFiles == null) || (this.uploadedFiles.length === 0)) &&
                   ((this.currentStage['attachments'] == null) || (this.currentStage.attachments.length === 0)) ) &&
                 ( (this.stageId === '6') || (this.stageId === '11') ||
                   (this.stageId === '7') || (this.stageId === '7a')) ) {

                this.stageFormError = 'Η επισύναψη εγγράφων είναι υποχρεωτική.';

            } else {
                const newStage = new FormData();
                Object.keys(this.stageForm.controls).forEach(key => {
                    newStage.append(key.toString(), this.stageForm.get(key).value);
                });

                if (this.uploadedFiles && (this.uploadedFiles.length > 0)) {
                    for (const f of this.uploadedFiles) {
                        newStage.append('attachments', f, f.name);
                    }
                }

                if (this.filesToBeDeleted.length > 0) {
                    for (const f of this.filesToBeDeleted) {
                        newStage.append('removed', f);
                    }
                }

                this.emitStage.emit([this.updateMode, newStage]);

            }

        } else {
            this.stageFormError = 'Πρέπει να έχουν γίνει όλοι οι έλεγχοι για να προχωρήσει το αίτημα.';
        }
    }

    /* display full name of the submitted stage's editor */
    getDelegateName() {
        return ' (' + this.currentStage['user']['firstname'] + ' ' + this.currentStage['user']['lastname'] + ')';
    }

    getCurrentDateString() {
        return this.datePipe.transform(Date.now(), 'dd/MM/yyyy');
    }

    showRejectionModal() {
        UIkit.modal('#rejectionModal' + this.stageId).show();
    }

}

@Component ({
    selector: 'stage2-component',
    templateUrl: './stages-components.html'
})
export class Stage2Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            checkNecessity: ['', Validators.requiredTrue],
            checkFeasibility: ['', Validators.requiredTrue],
            comment: ['']
        };
        this.stageId = '2';

        super.ngOnInit();
    }

}


@Component ({
    selector: 'stage3-component',
    templateUrl: './stages-templates/stage3.component.html'
})
export class Stage3Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            analiftheiYpoxrewsi: ['', Validators.requiredTrue],
            fundsAvailable: ['', Validators.requiredTrue],
            loan: [''],
            loanSource: [''],
            comment: ['']
        };
        this.stageId = '3';

        super.ngOnInit();

        if (this.stageForm && !this.stageForm.get('loan').value ) {
            this.stageForm.get('loanSource').disable();
        }
    }

    onLoanToggle (checkedLoan: boolean) {
        if (checkedLoan && (this.stageForm !== undefined) ) {
            this.stageForm.get('loanSource').enable();
            this.stageForm.get('loanSource').setValidators([Validators.required]);
            this.stageForm.get('loanSource').updateValueAndValidity();
        } else {
            this.stageForm.get('loanSource').disable();
        }
    }
}

@Component ({
    selector: 'stage4-component',
    templateUrl: './stages-components.html'
})
export class Stage4Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            analiftheiYpoxrewsi: ['', Validators.requiredTrue],
            fundsAvailable: ['', Validators.requiredTrue],
            comment: ['']
        };
        this.stageId = '4';

        super.ngOnInit();
    }
}

@Component ({
    selector: 'stage5a-component',
    templateUrl: './stages-components.html'
})
export class Stage5aComponent extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '5a';

        super.ngOnInit();
    }
}


@Component ({
    selector: 'stage5b-component',
    templateUrl: './stages-templates/stage5b.component.html'
})
export class Stage5bComponent extends StageComponent implements OnInit {
    amountNaN: boolean;
    showExtraFields: boolean;

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '5b';

        super.ngOnInit();

        if ( (this.currentRequestInfo.supplier !== undefined) &&
             (this.currentRequestInfo.supplier !== null) &&
             (this.currentRequestInfo.requestedAmount !== undefined) &&
             (this.currentRequestInfo.requestedAmount !== null) ) {
            this.showExtraFields = true;
            console.log('oldSupplierAndAmount are', this.currentRequestInfo.supplier, 'and', this.currentRequestInfo.requestedAmount);
        }

    }

    showAmount(event: any) {
        if (this.showExtraFields) {
            this.currentRequestInfo.requestedAmount = event.target.value;

            if (this.currentRequestInfo.requestedAmount.includes(',')) {

                const temp = this.currentRequestInfo.requestedAmount.replace(',', '.');
                this.currentRequestInfo.requestedAmount = temp;
            }

            this.amountNaN = isNaN(+this.currentRequestInfo.requestedAmount);
        }
    }

    emitNewValues(approved: boolean) {
        this.stageFormError = '';
        if ( this.showExtraFields ) {

            if (!approved) {
                if ( this.currentRequestInfo.supplier || this.currentRequestInfo.requestedAmount ) {

                    const newValArray = [];
                    newValArray.push(this.currentRequestInfo.supplier);
                    newValArray.push(this.currentRequestInfo.requestedAmount);
                    this.newValues.emit(newValArray);
                }
                this.approveRequest(approved);

            } else if ( (this.currentRequestInfo.supplier !== undefined) &&
                        (this.currentRequestInfo.supplier !== null) &&
                        (this.currentRequestInfo.requestedAmount !== undefined) &&
                        (this.currentRequestInfo.requestedAmount !== null) &&
                        !this.amountNaN &&
                        (this.currentRequestInfo.supplier.length > 0) &&
                        (this.currentRequestInfo.requestedAmount.length > 0) ) {

                const newValArray = [];
                newValArray.push(this.currentRequestInfo.supplier);
                newValArray.push(this.currentRequestInfo.requestedAmount);
                this.newValues.emit(newValArray);
                if (this.canEditStage) {
                    this.resubmitPreviousStage();
                } else {
                    this.approveRequest(approved);
                }

            } else {
                this.stageFormError = 'Τα πεδία που σημειώνονται με (*) είναι υποχρεωτικά.';
            }

        } else {
            if (this.canEditStage) {
                this.resubmitPreviousStage();
            } else {
                this.approveRequest(approved);
            }
        }
    }

    emitNewValuesAndGoBack() {
        if ( this.showExtraFields ) {
            if (((this.currentRequestInfo.supplier !== undefined) &&
                 (this.currentRequestInfo.supplier !== null)) ||
                ((this.currentRequestInfo.requestedAmount !== undefined) &&
                 (this.currentRequestInfo.requestedAmount !== null)) ) {

                const newValArray = [];
                newValArray.push(this.currentRequestInfo.supplier);
                newValArray.push(this.currentRequestInfo.requestedAmount);
                this.newValues.emit(newValArray);
            }
        }
        this.goBackOneStage();
    }

    updateSupplier(event: any) {
        this.currentRequestInfo.supplier = event.target.value;
    }

    updateAmount(event: any) {
        this.amountNaN = isNaN(+event.target.value);
        if (!this.amountNaN) {
            this.currentRequestInfo.requestedAmount = event.target.value;
        }
    }
}

@Component ({
    selector: 'stage6-component',
    templateUrl: './stages-templates/stage6And11.component.html'
})
export class Stage6Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '6';

        super.ngOnInit();
    }
}


@Component ({
    selector: 'stage7-component',
    templateUrl: './stages-templates/stage7.component.html'
})
export class Stage7Component extends StageComponent implements OnInit {
    amountNaN: boolean;
    showExtraFields: boolean;

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '7';

        super.ngOnInit();

        if ( this.currentRequestInfo.finalAmount != null ) {
            this.showExtraFields = true;
            console.log('oldFinalAmount is', this.currentRequestInfo.finalAmount);
        }
    }


    showAmount(event: any) {
        if (this.showExtraFields) {
            this.currentRequestInfo.finalAmount = event.target.value;

            if (this.currentRequestInfo.finalAmount.includes(',')) {

                const temp = this.currentRequestInfo.finalAmount.replace(',', '.');
                this.currentRequestInfo.finalAmount = temp;
            }

            this.amountNaN = isNaN(+this.currentRequestInfo.finalAmount);
        }
    }

    emitNewValuesAndForward() {
        this.stageFormError = '';
        if ( this.showExtraFields ) {
            if ( this.currentRequestInfo.finalAmount && !this.amountNaN &&
                 (this.currentRequestInfo.finalAmount.length > 0) ) {

                const newValArray = [];
                newValArray.push(this.currentRequestInfo.finalAmount);
                this.newValues.emit(newValArray);
                if (this.canEditStage) {
                    this.resubmitPreviousStage();
                } else {
                    this.approveRequest(true);
                }

            } else {
                this.stageFormError = 'Παρακαλώ συμπληρώστε ένα τελικό ποσό.';
            }

        } else {
            if (this.canEditStage) {
                this.resubmitPreviousStage();
            } else {
                this.approveRequest(true);
            }
        }
    }

    updateAmount(event: any) {
        this.amountNaN = isNaN(+event.target.value);
        if (!this.amountNaN) {
            this.currentRequestInfo.finalAmount = event.target.value;
        }
    }

}

@Component ({
    selector: 'stage7a-component',
    templateUrl: './stages-components.html'
})
export class Stage7aComponent extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '7a';

        super.ngOnInit();
    }
}


@Component ({
    selector: 'stage8-component',
    templateUrl: './stages-components.html'
})
export class Stage8Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            checkRegularity: ['', Validators.requiredTrue],
            checkLegality: ['', Validators.requiredTrue],
            comment: ['']
        };
        this.stageId = '8';

        super.ngOnInit();
    }
}

@Component ({
    selector: 'stage9-component',
    templateUrl: './stages-components.html'
})
export class Stage9Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            checkRegularity: ['', Validators.requiredTrue],
            checkLegality: ['', Validators.requiredTrue],
            comment: ['']
        };
        this.stageId = '9';

        super.ngOnInit();
    }
}

@Component ({
    selector: 'stage10-component',
    templateUrl: './stages-components.html'
})
export class Stage10Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '10';

        super.ngOnInit();
    }
}

@Component ({
    selector: 'stage11-component',
    templateUrl: './stages-templates/stage6And11.component.html'
})
export class Stage11Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '11';

        super.ngOnInit();
    }
}

@Component ({
    selector: 'stage12-component',
    templateUrl: './stages-components.html'
})
export class Stage12Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '12';

        super.ngOnInit();
    }
}


@Component ({
    selector: 'stage13-component',
    templateUrl: './stages-components.html'
})
export class Stage13Component extends StageComponent implements OnInit {

    ngOnInit () {
        this.stageFormDefinition = {
            comment: ['']
        };
        this.stageId = '13';

        super.ngOnInit();
    }
}
