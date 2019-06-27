/*
* created by myrto on 11/6/2019
* */

import { Component, OnInit } from '@angular/core';
import { BudgetAmountsStatus, BudgetResponse } from '../domain/operation';
import { budgetStages, budgetStatusNamesMap } from '../domain/stageDescriptions';
import { RequestInfo } from '../domain/requestInfoClasses';
import { AnchorItem } from '../shared/dynamic-loader-anchor-components/anchor-item';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageBudgetsService } from '../services/manage-budgets.service';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { AuthenticationService } from '../services/authentication.service';
import { printRequestPage } from '../request-stage/print-request-function';

declare var UIkit: any;

@Component({
    selector: 'app-budget',
    templateUrl: './budget.component.html'
})
export class BudgetComponent implements OnInit {
    errorMessage: string;
    notFoundMessage: string;
    successMessage: string;
    showSpinner: boolean;

    budgetId: string;
    currentBudget: BudgetResponse;
    stages: string[] = budgetStages;
    stateNames = budgetStatusNamesMap;

    currentRequestInfo: RequestInfo;

    stageLoaderAnchorItem: AnchorItem;
    prevStageLoaderAnchorItem: AnchorItem;
    showStage1: boolean;
    canBeCancelled: boolean;

    showAmounts: boolean;
    amountsStatus: BudgetAmountsStatus;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private authService: AuthenticationService,
                private budgetService: ManageBudgetsService) {}


    ngOnInit(): void {
        this.route.paramMap.subscribe(
            params => {
                this.initializeVariables();
                if (params.has('id')) {
                    this.budgetId = params.get('id');
                    this.getCurrentBudget();
                }
            }
        );
    }

    initializeVariables() {
        this.currentBudget = null;
        this.currentRequestInfo = null;
        this.stageLoaderAnchorItem = null;
        this.prevStageLoaderAnchorItem = null;
    }

    getCurrentBudget() {
        this.showSpinner = true;
        this.budgetId = this.route.snapshot.paramMap.get('id');
        this.errorMessage = '';
        this.notFoundMessage = '';

        /* get request info */
        this.budgetService.getById(this.budgetId).subscribe(
            res => this.currentBudget = res,
            error => {
                console.log(error);
                this.showSpinner = false;
                console.log('error status is', error.status);
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 404) {
                        this.notFoundMessage = 'Ο προϋπολογισμός που ζητήσατε δεν βρέθηκε.';
                    } else {
                        this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την ανάκτηση του προϋπολογισμού.';
                    }
                }
                window.scrollTo(1, 1);
            },
            () => {
                this.showSpinner = false;
                this.currentRequestInfo = new RequestInfo(this.currentBudget.id, null);
                this.findPreviousStage();
                this.updateShowStageFields();
                this.setCanBeCancelled();
                this.showAmounts = ((this.currentBudget.budgetStatus === 'ACCEPTED') &&
                                    (this.userIsAdmin() || this.currentBudget.canEditPrevious));

                // show budget amounts status only while editing an accepted budget
                if (this.showAmounts) {
                    this.getAmountsStatus();
                }
                window.scrollTo(1, 1);
            }
        );
    }

    getAmountsStatus() {
        this.showSpinner = true;
        this.errorMessage = '';
        this.budgetService.getAmounts(this.currentBudget.id).subscribe(
            res => this.amountsStatus = res,
            er => {
                console.log(er);
                this.showSpinner = false;
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την ανάκτηση των απαραίτητων πληροφοριών.';
            },
            () => this.showSpinner = false
        );
    }

    // detects previous stage and checks if the current user has permission to edit it
    findPreviousStage() {
        if (((this.currentBudget.budgetStatus === 'PENDING') || (this.currentBudget.budgetStatus === 'UNDER_REVIEW')) &&
            (this.currentBudget.stage !== '1')) {
            let prevStage: string;
            if (this.currentBudget.stage === '2') {
                prevStage = '1';
            } else {
                const i = this.stages.indexOf(this.currentBudget.stage);
                if ((i > 0) && (this.currentBudget['stage' + this.stages[i - 1]] != null) ) {
                    prevStage = this.stages[i - 1];
                }
            }
            if ((this.currentBudget.canEditPrevious === true) || (this.userIsAdmin())) {
                this.currentRequestInfo.previousStage = prevStage;
            }
        } else if ((this.currentBudget.budgetStatus === 'ACCEPTED') &&
                   (this.currentBudget.canEditPrevious === true) || (this.userIsAdmin()) ) {
            this.currentRequestInfo.previousStage = '1';
        }
    }

    getSubmittedStage(submittedData: any[]) {
        this.updateBudget(submittedData[0], submittedData[1]);
    }

    getUpdatedBudget(updatedBudget: FormData) {
        if ((this.currentRequestInfo.previousStage != null) &&
            (this.currentRequestInfo.previousStage === '1')) {
            this.updateBudget('edit', updatedBudget);
        } else {
            // TODO:: CHECK WHAT TO SEND WHEN IN EDIT MODE BUT BUDGET IS ACCEPTED
            this.updateBudget('approve', updatedBudget);
        }
    }

    updateBudget(mode: string, submitted: FormData) {
        window.scrollTo(1, 1);
        this.showSpinner = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.budgetService.submitUpdate<any>(mode, this.currentBudget.id, submitted)
            .subscribe(
                event => {
                    if (event.type === HttpEventType.UploadProgress) {
                        console.log('update budget says:', event.loaded);
                    } else if ( event instanceof HttpResponse) {
                        console.log('final event:', event.body);
                    }
                },
                error => {
                    console.log(error);
                    this.showSpinner = false;
                    this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την αποθήκευση των αλλαγών.';
                },
                () => {
                    this.successMessage = 'Οι αλλαγές αποθηκεύτηκαν.';
                    this.getCurrentBudget();
                }
            );
    }

    updateShowStageFields() {
        for ( let i = 1; i < this.stages.length; i++ ) {
            this.currentRequestInfo[this.stages[i]].showStage = this.willShowStage(this.stages[i]);
            // console.log(`${this.stages[i]} is ${this.currentRequestInfo[this.stages[i]].showStage}`);
        }
        this.showStage1 = (this.willShowStage('1') === 2);
    }

    editStage1(showForm: boolean) {
        this.showStage1 = !showForm;
    }

    editPreviousStage(showForm: boolean) {
        if (this.currentRequestInfo.previousStage) {
            const prevStage = this.currentRequestInfo.previousStage;

            if (showForm) {
                // send data to the form component
                this.prevStageLoaderAnchorItem = new AnchorItem(
                    this.currentRequestInfo[prevStage][ 'stageComponent' ],
                    {
                        currentStage: this.currentBudget['stage' + prevStage],
                        currentRequestInfo: this.currentRequestInfo
                    }
                );
                this.currentRequestInfo[prevStage].showStage = 1;
            } else {
                this.currentRequestInfo[prevStage].showStage = this.willShowStage(prevStage);
                this.prevStageLoaderAnchorItem = null;
                this.currentRequestInfo.previousStage = null;
            }
        }
    }


    willShowStage(stage: string) {
        /* return values:  0 -> don't show
                           1 -> show form
                           2 -> was approved
                           3 -> was rejected
                           4 -> was returned to previous*/

        if ((stage === this.currentBudget.stage) &&
            (this.currentBudget.budgetStatus !== 'REJECTED') &&
            (this.currentBudget.budgetStatus !== 'ACCEPTED') &&
            (this.currentBudget.budgetStatus !== 'CANCELLED') &&
            ( (this.authService.getUserRole().some(x => x.authority === 'ROLE_ADMIN')) ||
              (this.currentBudget.canEdit === true) ) ) {

            if (this.currentBudget.stage !== '1') {
                if (this.currentBudget['stage' + stage] == null) {
                    this.currentBudget['stage' + stage] = this.currentRequestInfo.createNewStageObject(stage);
                }
                this.stageLoaderAnchorItem =  new AnchorItem(
                    this.currentRequestInfo[stage]['stageComponent'],
                    {
                        currentStage: this.currentBudget['stage' + stage],
                        currentRequestInfo: this.currentRequestInfo
                    }
                );
            }

            return 1;

        } else {
            if (stage === '1') {
                return 2;
            }
            if ( (this.currentBudget['stage' + stage]) && (this.currentBudget['stage' + stage].date)) {
                if ( this.stages.indexOf(this.currentBudget.stage) < this.stages.indexOf(stage)) {
                    return 4;
                }

                if ( stage === this.currentBudget.stage ) {

                    // const prevStage = this.stages[this.stages.indexOf(stage) - 1];
                    let prevStage;
                    for (const p of this.currentRequestInfo[stage].prev) {
                        if (this.currentBudget['stage' + p] != null) {
                            prevStage = p;
                            break;
                        }
                    }
                    if ((this.currentBudget['stage' + prevStage]) &&
                        (this.currentBudget['stage' + prevStage].date) &&
                        (this.currentBudget['stage' + prevStage].date > this.currentBudget['stage' + stage].date) ) {

                        return 4;
                    }
                }

                if (((this.currentBudget['stage' + stage]['approved'] != null) &&
                     this.currentBudget['stage' + stage]['approved'] === true ) || (stage === '6') ) {

                    return 2;

                } else {
                    return 3;
                }
            }
        }

        return 0;
    }


    linkToFile(fieldName: string, fileIndex?: number) {
        if (fileIndex && this.currentBudget[fieldName]) {
            if (this.currentBudget[fieldName][fileIndex] &&
                this.currentBudget[fieldName][fileIndex].url) {

                let url = `${window.location.origin}/arc-expenses-service/request/store?`;
                url = `${url}archiveId=${encodeURIComponent(this.currentBudget[fieldName][fileIndex].url)}`;
                url = `${url}&id=${this.currentBudget.id}`;

                window.open(url, '_blank');
            }
        } else {
            if (this.currentBudget[fieldName] && this.currentBudget[fieldName].url) {

                let url = `${window.location.origin}/arc-expenses-service/budget/store?`;
                url = `${url}archiveId=${encodeURIComponent(this.currentBudget[fieldName].url)}`;
                url = `${url}&id=${this.currentBudget.id}`;

                window.open(url, '_blank');
            }
        }
    }

    printBudget() {
        printRequestPage(this.currentBudget.id);
    }

    setCanBeCancelled() {
        if (this.userIsAdmin() || this.userIsRequester()) {
            this.canBeCancelled = ((this.currentBudget.budgetStatus === 'PENDING') || (this.currentBudget.budgetStatus === 'UNDER_REVIEW'));
        }
        return false;
    }

    userIsAdmin() {
        return (this.authService.getUserRole().some(x => x.authority === 'ROLE_ADMIN'));
    }

    userIsRequester() {
        return (this.authService.getUserProp('email').toLowerCase() === this.currentBudget.submittedBy.email.toLowerCase());
    }

    confirmedCancel() {
        this.budgetService.submitUpdate<any>('cancel', this.currentBudget.id).subscribe(
            event => {
                if (event.type === HttpEventType.UploadProgress) {
                    console.log('cancel budget responded: ', event.loaded);
                } else if ( event instanceof HttpResponse) {
                    console.log('final event:', event.body);
                }
            },
            error => {
                console.log(error);
                this.showSpinner = false;
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την αποθήκευση των αλλαγών.';
                UIkit.modal('#cancellationModal').hide();
                window.scrollTo(1, 1);
            },
            () => {
                this.successMessage = 'Το αίτημα ακυρώθηκε.';
                this.showSpinner = false;
                UIkit.modal('#cancellationModal').hide();
                this.getCurrentBudget();
            }
        );
    }

}
