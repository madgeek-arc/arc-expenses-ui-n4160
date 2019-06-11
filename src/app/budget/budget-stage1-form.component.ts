/*
* created by myrto on 11/6/2019
* */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BudgetResponse } from '../domain/operation';
import { FormBuilder, FormGroup } from '@angular/forms';

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
    boardDecision: File;
    technicalReport: File;

    amountsByType = { regularAmount: '0', contractAmount: '0', tripAmount: '0', servicesContractAmount: '0' };

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
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
    }
}
