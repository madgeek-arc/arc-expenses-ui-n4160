/*
* created by myrto on 11/6/2019
* */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BudgetResponse } from '../domain/operation';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-budget-stage1',
    templateUrl: './budget-stage1-form.component.html'
})
export class BudgetStage1FormComponent implements OnInit {
    errorMessage: string;

    @Input() currentBudget: BudgetResponse;

    /* output variable that sends the new Stage back to the parent component
     * in order to call the api and update the request */
    @Output() emitBudget: EventEmitter<FormData> = new EventEmitter<FormData>();

    updateStage1Form: FormGroup;
    formDefinition = {
        regularAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
        contractAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
        tripAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
        servicesContractAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
        comment: ['']
    };
    boardDecision: File;
    boardDecisionName: string;
    technicalReport: File;
    technicalReportName: string;

    amountsByType = { regularAmount: '0', contractAmount: '0', tripAmount: '0', servicesContractAmount: '0' };

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.createForm();
    }

    createForm() {
        this.updateStage1Form = this.fb.group(this.formDefinition);
        Object.keys(this.formDefinition).forEach(
            key => {
                this.updateStage1Form.patchValue({[ key ]: this.currentBudget[ key ]});
            }
        );
    }

    getBoardDecisionFile(file: File) {
        /* INFORM THE SERVICE THAT THE FILE WAS REMOVED??? */
        this.boardDecision = file;
    }

    getTechnicalReportFile(file: File) {
        /* INFORM THE SERVICE THAT THE FILE WAS REMOVED??? */
        this.technicalReport = file;
    }

    updateStage1() {
        console.log(this.updateStage1Form.getRawValue());
        this.errorMessage = '';
        if (this.updateStage1Form.valid ) {
            if (!this.updateStage1Form.get('regularAmount').value &&
                !this.updateStage1Form.get('contractAmount').value &&
                !this.updateStage1Form.get('tripAmount').value &&
                !this.updateStage1Form.get('servicesContractAmount').value) {

                this.errorMessage = 'Θα πρέπει να συμπληρώσετε ποσό για τουλάχιστον μία από τις κατηγορίες δαπανών.';
            }  else if ((!this.boardDecision && !this.currentBudget.boardDecision) ||
                        (!this.technicalReport && !this.currentBudget.technicalReport)) {
                this.errorMessage = 'Η επισύναψη της απόφασης του Διοικητικού Συμβουλίου και του Τεχνικού Δελτίου είναι υποχρεωτική.';
            } else {
                const updatedBudget = new FormData();
                Object.keys(this.formDefinition).forEach(
                    key => updatedBudget.append(key, this.updateStage1Form.get(key).value)
                );

                if ( this.boardDecision ) {
                    updatedBudget.append('boardDecision', this.boardDecision, this.boardDecision.name);
                }

                if ( this.technicalReport ) {
                    updatedBudget.append('technicalReport', this.technicalReport, this.technicalReport.name);
                }

                this.emitBudget.emit(updatedBudget);

            }

        } else {
            this.errorMessage = 'Τα πεδία που σημειώνονται με (*) είναι υποχρεωτικά';
        }
    }

    showAmount(fieldName: string) {
        if (this.updateStage1Form.get(fieldName).value && this.updateStage1Form.get(fieldName).value.trim().includes(',')) {
            const temp = this.updateStage1Form.get(fieldName).value.replace(',', '.');
            this.updateStage1Form.get(fieldName).setValue(temp);
        }

        this.updateStage1Form.get(fieldName).updateValueAndValidity();
        if ( !isNaN(this.updateStage1Form.get(fieldName).value.trim()) ) {
            this.amountsByType[fieldName] = this.updateStage1Form.get(fieldName).value.trim();
        }

        this.boardDecisionName = this.currentBudget.boardDecision.filename;
        this.technicalReportName = this.currentBudget.technicalReport.filename;
    }
}
