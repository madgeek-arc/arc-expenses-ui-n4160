/*
* created by myrto on 10/6/2019
* */

import { Component, OnInit } from '@angular/core';
import { ManageBudgetsService } from '../services/manage-budgets.service';
import { ManageProjectService } from '../services/manage-project.service';
import { AuthenticationService } from '../services/authentication.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, Vocabulary } from '../domain/operation';
import { Router } from '@angular/router';
import { HttpEventType, HttpResponse } from '@angular/common/http';

@Component({
    selector: 'app-new-budget',
    templateUrl: './new-budget.component.html',
    styleUrls: ['./new-budget.component.scss']
})
export class NewBudgetComponent implements OnInit {

    errorMessage: string;
    showSpinner: boolean;
    currentUser: User;

    newBudgetForm: FormGroup;
    boardDecision: File;
    technicalReport: File;

    searchTerm = '';

    projects: Vocabulary[] = [];
    chosenProject: Vocabulary;

    amountsByType = { regularAmount: '0', contractAmount: '0', tripAmount: '0', servicesContractAmount: '0' };

    constructor(private authService: AuthenticationService,
                private budgetService: ManageBudgetsService,
                private projectService: ManageProjectService,
                private fb: FormBuilder,
                private router: Router) {}

    ngOnInit(): void {
        this.getUserInfo();
        this.getProjects();
        this.createForm();
    }

    getUserInfo() {
        this.currentUser = new User();
        this.currentUser.id = this.authService.getUserProp('id');
        this.currentUser.email = this.authService.getUserProp('email');
        this.currentUser.firstname = this.authService.getUserProp('firstname');
        this.currentUser.lastname = this.authService.getUserProp('lastname');
        console.log('this.currentUser is: ', this.currentUser);
    }


    getProjects() {
        this.showSpinner = true;
        this.errorMessage = '';
        this.projects = [];
        this.projectService.getAllProjectsNames().subscribe (
            projects => {
                this.projects = projects;
            },
            error => {
                console.log(error);
                this.showSpinner = false;
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα με την ανάκτηση των απαραίτητων πληροφοριών.';
                window.scrollTo(1, 1);
            },
            () => {
                this.showSpinner = false;
                this.errorMessage = '';
                if ( ((this.projects === null) || (this.projects === undefined)) ||
                    (this.projects.length === 0)) {
                    this.errorMessage = 'Παρουσιάστηκε πρόβλημα με την ανάκτηση των απαραίτητων πληροφοριών.';
                }
                window.scrollTo(1, 1);
            }
        );
    }

    createForm() {
        this.newBudgetForm = this.fb.group({
            userFullName: [''],
            project: ['', Validators.required],
            institute: [''],
            year: ['', [Validators.required, Validators.min(2000), Validators.maxLength(4),
                        Validators.minLength(4), Validators.pattern('^\\d{4}$')]],
            regularAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
            contractAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
            tripAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
            servicesContractAmount: ['', [Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')]],
            comment: ['']
        });
        this.newBudgetForm.get('userFullName').setValue(`${this.currentUser.firstname} ${this.currentUser.lastname}`);
        this.newBudgetForm.get('userFullName').disable();
    }

    submitBudget() {
        if (this.newBudgetForm.valid) {
            if (!this.newBudgetForm.get('regularAmount').value &&
                !this.newBudgetForm.get('contractAmount').value &&
                !this.newBudgetForm.get('tripAmount').value &&
                !this.newBudgetForm.get('servicesContractAmount').value) {

                this.errorMessage = 'Θα πρέπει να συμπληρώσετε ποσό για τουλάχιστον μία από τις κατηγορίες δαπανών.';
            } else if (!this.boardDecision || !this.technicalReport) {
                this.errorMessage = 'Η επισύναψη της απόφασης του Διοικητικού Συμβουλίου και του Τεχνικού Δελτίου είναι υποχρεωτική.';
            } else {
                const newBudget = new FormData();
                newBudget.append('projectId', this.chosenProject.projectID);
                newBudget.append('year', this.newBudgetForm.get('year').value);
                newBudget.append('regularAmount', this.newBudgetForm.get('regularAmount').value);
                newBudget.append('contractAmount', this.newBudgetForm.get('contractAmount').value);
                newBudget.append('tripAmount', this.newBudgetForm.get('tripAmount').value);
                newBudget.append('servicesContractAmount', this.newBudgetForm.get('servicesContractAmount').value);
                newBudget.append('comment', this.newBudgetForm.get('comment').value);
                newBudget.append('boardDecision', this.boardDecision, this.boardDecision.name);
                newBudget.append('technicalReport', this.technicalReport, this.technicalReport.name);
                this.showSpinner = true;
                this.errorMessage = '';
                this.budgetService.add<any>(newBudget).subscribe (
                    event => {
                        if (event.type === HttpEventType.UploadProgress) {
                            console.log('addBudget responded: ', event.loaded);
                        } else if ( event instanceof HttpResponse) {
                            console.log('final event:', event.body);
                        }
                    },
                    error => {
                        console.log(error);
                        this.errorMessage = 'Παρουσιάστηκε πρόβλημα με την υποβολή της φόρμας.';
                        this.showSpinner = false;
                        window.scroll(1, 1);
                    },
                    () => {
                        this.errorMessage = '';
                        this.showSpinner = false;
                        this.router.navigate(['/budgets']);
                    }
                );
            }
        } else {
            this.errorMessage = 'Τα πεδία που σημειώνονται με (*) είναι υποχρεωτικά.';
            for (const c of Object.keys(this.newBudgetForm.getRawValue())) {
                this.newBudgetForm.get(c).markAsTouched();
            }
        }
        window.scroll(1, 1);
    }

    updateSearchTerm(event: any) {
        this.searchTerm = event.target.value;
        if ( (this.searchTerm === '') && (this.chosenProject != null) ) {
            this.newBudgetForm.get('project').setValue('');
            this.newBudgetForm.get('institute').setValue('');
            this.newBudgetForm.get('institute').enable();
        }
    }

    updateProjectInput(project: Vocabulary) {
        /*console.log(this.projects);*/
        this.newBudgetForm.get('project').setValue(project.projectAcronym);
        this.newBudgetForm.get('institute').setValue(`${project.instituteName} (${project.instituteId})`);
        this.newBudgetForm.get('institute').disable();
        this.chosenProject = project;
        this.searchTerm = '';
    }

    getBoardDecisionFile(file: File) {
        this.boardDecision = file;
    }

    getTechnicalReportFile(file: File) {
        this.technicalReport = file;
    }


    showAmount(fieldName: string) {
        if (this.newBudgetForm.get(fieldName).value && this.newBudgetForm.get(fieldName).value.trim().includes(',')) {
            const temp = this.newBudgetForm.get(fieldName).value.replace(',', '.');
            this.newBudgetForm.get(fieldName).setValue(temp);
        }

        this.newBudgetForm.get(fieldName).updateValueAndValidity();
        if ( !isNaN(this.newBudgetForm.get(fieldName).value.trim()) ) {
            this.amountsByType[fieldName] = this.newBudgetForm.get(fieldName).value.trim();
        }
    }


}

