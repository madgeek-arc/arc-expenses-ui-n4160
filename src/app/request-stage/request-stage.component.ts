import { Component, OnInit } from '@angular/core';
import { RequestPayment, RequestResponse } from '../domain/operation';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageRequestsService } from '../services/manage-requests.service';
import { AuthenticationService } from '../services/authentication.service';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { approvalStages, requesterPositions, requestTypes, stageTitles,
         statusNamesMap, supplierSelectionMethodsMap } from '../domain/stageDescriptions';
import { printRequestPage } from './print-request-function';
import { AnchorItem } from '../shared/dynamic-loader-anchor-components/anchor-item';
import { RequestInfo } from '../domain/requestInfoClasses';

declare var UIkit: any;

@Component({
    selector: 'app-request-stage',
    templateUrl: './request-stage.component.html',
    styleUrls: ['./request-stage.component.scss']
})
export class RequestStageComponent implements OnInit {
    errorMessage: string;
    notFoundMessage: string;
    successMessage: string;
    showSpinner: boolean;

    isSimpleUser: boolean;
    requestId: string;
    currentRequestApproval: RequestResponse;
    currentRequestPayments: RequestPayment[] = [];
    stages: string[] = approvalStages;
    stagesMap = stageTitles;
    reqPositions = requesterPositions;
    selMethods = supplierSelectionMethodsMap;
    stateNames = statusNamesMap;
    reqTypes = requestTypes;

    currentRequestInfo: RequestInfo;

    stageLoaderAnchorItem: AnchorItem;
    prevStageLoaderAnchorItem: AnchorItem;
    showStage1: boolean;
    canBeCancelled: boolean;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private requestService: ManageRequestsService,
                private authService: AuthenticationService) {
    }

    ngOnInit() {
        this.isSimpleUser = (this.authService.getUserRole().some(x => x.authority === 'ROLE_USER') &&
                             (this.authService.getUserRole().length === 1));

        this.route.paramMap.subscribe(
            params => {
                this.initializeVariables();
                if (params.has('id')) {
                    this.requestId = params.get('id');
                    this.getCurrentRequest();
                }
            }
        );
    }

    initializeVariables() {
        this.currentRequestApproval = null;
        this.currentRequestInfo = null;
        this.currentRequestPayments = [];
        this.stageLoaderAnchorItem = null;
        this.prevStageLoaderAnchorItem = null;
    }

    getCurrentRequest() {
        this.showSpinner = true;
        this.requestId = this.route.snapshot.paramMap.get('id');
        this.errorMessage = '';
        this.notFoundMessage = '';

        /* get request info */
        this.requestService.getRequestApprovalById(this.requestId).subscribe(
            res => this.currentRequestApproval = res,
            error => {
                console.log(error);
                this.showSpinner = false;
                console.log('error status is', error.status);
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 404) {
                        this.notFoundMessage = 'Το αίτημα που ζητήσατε δεν βρέθηκε.';
                    } else {
                        this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την ανάκτηση του αιτήματος.';
                    }
                }
                window.scrollTo(1, 1);
            },
            () => {
                this.showSpinner = false;
                this.currentRequestInfo = new RequestInfo(this.currentRequestApproval.baseInfo.id,
                                                          this.currentRequestApproval.baseInfo.requestId);
                this.findPreviousStage();
                this.checkIfStageIs5b(this.currentRequestApproval.baseInfo.stage);
                this.getRequestPayments();
                window.scrollTo(1, 1);
            }
        );
    }

    // detects previous stage and checks if the current user has permission to edit it
    findPreviousStage() {
        if ((this.currentRequestApproval.requestStatus === 'PENDING') &&
            (this.currentRequestApproval.baseInfo.stage !== '1')) {
            const i = this.stages.indexOf(this.currentRequestApproval.baseInfo.stage);
            if (i > -1) {
                let prevStage: string;

                if (this.currentRequestApproval.baseInfo.status === 'ACCEPTED') {
                    prevStage = '6';
                } else {
                    for (const p of this.currentRequestInfo[ this.stages[i] ].prev) {
                        if (this.currentRequestApproval.stages[p] != null) {
                            prevStage = p;
                            break;
                        }
                    }
                }

                // TODO:: MAKE SURE THE canEditPrevious value is the correct one when prevStage == 6
                if ((prevStage != null) && ((this.currentRequestApproval.canEditPrevious === true) || (this.userIsAdmin()))) {

                    this.currentRequestInfo.previousStage = prevStage;
                }
            }
        }
    }

    checkIfStageIs5b(stage: string) {
        if ( (stage === '5b') &&
             (this.currentRequestApproval.stages['1']['supplierSelectionMethod'] === 'AWARD_PROCEDURE') ) {

            this.currentRequestInfo.supplier = '';
            this.currentRequestInfo.requestedAmount = '';
            if ( this.currentRequestApproval.stages['1']['supplier'] ) {
                this.currentRequestInfo.supplier = this.currentRequestApproval.stages['1']['supplier'];
            }
            if ( this.currentRequestApproval.stages['1']['amountInEuros'] ) {
                this.currentRequestInfo.requestedAmount = (this.currentRequestApproval.stages['1']['amountInEuros']).toString();
            }
        }
    }

    getRequestPayments() {
        this.errorMessage = '';
        this.requestService.getPaymentsOfRequest(this.currentRequestApproval.baseInfo.requestId).subscribe(
            res => this.currentRequestPayments = res.results,
            error => {
                console.log(error);
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την ανάκτηση του αιτήματος.';
                this.showSpinner = false;
                window.scrollTo(1, 1);
            },
            () => {
                this.showSpinner = false;
                console.log(this.currentRequestPayments.length);
                this.updateShowStageFields();
                this.setCanBeCancelled();
                window.scrollTo(1, 1);
            }
        );
    }

    getSubmittedStage(submittedData: any[]) {
        this.updateRequest(submittedData[0], submittedData[1]);
    }

    getUpdatedRequest(updatedRequest: FormData) {
        if ((this.currentRequestInfo.previousStage != null) &&
            (this.currentRequestInfo.previousStage === '1')) {
            this.updateRequest('edit', updatedRequest);
        } else {
            this.updateRequest('approve', updatedRequest);
        }
    }

    getNewSupplierAndAmount(newVals: string[]) {
        if (newVals && newVals.length === 2) {
            this.currentRequestApproval.stages['1']['supplier'] = newVals[0];
            this.currentRequestApproval.stages['1']['amountInEuros'] = +newVals[1];
            this.currentRequestApproval.stages['1']['finalAmount'] = +newVals[1];
        }
    }

    updateRequest(mode: string, submitted: FormData) {
        window.scrollTo(0, 0);
        this.showSpinner = true;
        this.errorMessage = '';
        this.successMessage = '';
        if ((this.currentRequestApproval.baseInfo.stage === '5b') ||
             ((mode === 'edit') && (this.currentRequestInfo.previousStage != null) && (this.currentRequestInfo.previousStage === '5b'))) {
            submitted.append('supplier', this.currentRequestApproval.stages['1']['supplier']);
            submitted.append('amountInEuros', this.currentRequestApproval.stages['1']['amountInEuros'].toString());
        }
        this.requestService.submitUpdate<any>('request', mode, this.currentRequestApproval.baseInfo.requestId, submitted)
            .subscribe(
                event => {
                    if (event.type === HttpEventType.UploadProgress) {
                        console.log('update progress says:', event.loaded);
                    } else if ( event instanceof HttpResponse) {
                        console.log('final event:', event.body);
                    }
                },
                error => {
                    console.log(error);
                    this.showSpinner = false;
                    this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την αποθήκευση των αλλαγών.';
                    window.scrollTo(1, 1);
                },
                () => {
                    this.successMessage = 'Οι αλλαγές αποθηκεύτηκαν.';
                    this.getCurrentRequest();
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

    editStage1() {
        this.showStage1 = false;
    }

    editPreviousStage(showForm: boolean) {
        if (this.currentRequestInfo.previousStage) {
            const prevStage = this.currentRequestInfo.previousStage;

            if (showForm) {
                // send data to the form component
                this.checkIfStageIs5b(prevStage);
                this.prevStageLoaderAnchorItem = new AnchorItem(
                    this.currentRequestInfo[prevStage][ 'stageComponent' ],
                    {
                        currentStage: this.currentRequestApproval.stages[prevStage],
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

        if ((stage === this.currentRequestApproval.baseInfo.stage) &&
            (this.currentRequestApproval.baseInfo.status !== 'REJECTED') &&
            (this.currentRequestApproval.baseInfo.status !== 'ACCEPTED') &&
            (this.currentRequestApproval.baseInfo.status !== 'CANCELLED') &&
            ( (this.authService.getUserRole().some(x => x.authority === 'ROLE_ADMIN')) ||
              (this.currentRequestApproval.canEdit === true) ) ) {

            if (this.currentRequestApproval.baseInfo.stage !== '1') {
                if (this.currentRequestApproval.stages[stage] == null) {
                    this.currentRequestApproval.stages[stage] = this.currentRequestInfo.createNewStageObject(stage);
                }
                this.stageLoaderAnchorItem =  new AnchorItem(
                        this.currentRequestInfo[stage]['stageComponent'],
                        {
                            currentStage: this.currentRequestApproval.stages[stage],
                            currentRequestInfo: this.currentRequestInfo
                        }
                    );
            }

            return 1;

        } else {
            if (stage === '1') {
                return 2;
            }
            if ( (this.currentRequestApproval.stages[stage]) && (this.currentRequestApproval.stages[stage].date)) {
                if (!this.isSimpleUser || (stage === '2') ) {
                    if ( this.stages.indexOf(this.currentRequestApproval.baseInfo.stage) < this.stages.indexOf(stage)) {
                        return 4;
                    }

                    if ( stage === this.currentRequestApproval.baseInfo.stage ) {

                        // const prevStage = this.stages[this.stages.indexOf(stage) - 1];
                        let prevStage;
                        for (const p of this.currentRequestInfo[stage].prev) {
                            if (this.currentRequestApproval.stages[p] != null) {
                                prevStage = p;
                                break;
                            }
                        }
                        if ((this.currentRequestApproval.stages[prevStage]) &&
                            (this.currentRequestApproval.stages[prevStage].date) &&
                            (this.currentRequestApproval.stages[prevStage].date > this.currentRequestApproval.stages[stage].date) ) {

                            return 4;
                        }
                    }

                    if ( ((this.currentRequestApproval.stages[stage]['approved'] != null) &&
                          this.currentRequestApproval.stages[stage]['approved'] === true ) ||
                         (stage === '6') ) {

                        return 2;

                    } else {
                        return 3;
                    }
                }
            }
        }

        return 0;
    }

    linkToFile(fileIndex: number) {
        if (this.currentRequestApproval.stages['1'].attachments &&
            this.currentRequestApproval.stages['1'].attachments[fileIndex] &&
            this.currentRequestApproval.stages['1'].attachments[fileIndex].url) {

            let url = `${window.location.origin}/arc-expenses-service/request/store?`;
            url = `${url}archiveId=${encodeURIComponent(this.currentRequestApproval.stages['1'].attachments[fileIndex].url)}`;
            url = `${url}&id=${this.currentRequestApproval.baseInfo.id}`;
            url = `${url}&mode=approval`;

            window.open(url, '_blank');
        }
    }

    printRequest() {
        printRequestPage(this.currentRequestApproval.baseInfo.requestId);
    }

    createRequestPayment() {

        this.requestService.addRequestPayment(this.currentRequestApproval.baseInfo.requestId).subscribe(
            res => {
                console.log(JSON.stringify(res));
                this.showSpinner = false;
                this.router.navigate(['/requests/request-stage-payment/', res['id']]);
            },
            error => {
                window.scroll(1, 1);
                console.log(error);
                this.showSpinner = false;
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την αποθήκευση των αλλαγών.';
            }
        );
    }

    getStatusAsString( status: string ) {
        if ( (status === 'PENDING') || (status === 'UNDER_REVIEW') ) {
            return 'σε εξέλιξη';
        } else if (status === 'ACCEPTED') {
            return 'ολοκληρωθηκε';
        } else {
            return 'απορρίφθηκε';
        }
    }

    getTooltipText() {
        if (this.currentRequestApproval.baseInfo.status === 'ACCEPTED') {
            return 'Για την ακύρωση του αιτήματος παρακαλώ μεταβείτε στην σελίδα της περαίωσης.';
        } else {
            return 'Πατήστε για να<br>ακυρώσετε το αίτημα';
        }
    }

    setCanBeCancelled() {
        if (this.userIsAdmin() || this.userIsRequester() || this.userIsOnBehalfUser()) {
            if (this.currentRequestApproval.type === 'CONTRACT') {
                this.canBeCancelled = (this.currentRequestApproval.baseInfo.status === 'PENDING');
            } else {
                this.canBeCancelled = ((this.currentRequestApproval.baseInfo.status !== 'REJECTED') &&
                                       (this.currentRequestApproval.baseInfo.status !== 'CANCELLED'));
            }
        }
        return false;
    }

    userIsAdmin() {
        return (this.authService.getUserRole().some(x => x.authority === 'ROLE_ADMIN'));
    }

    userIsRequester() {
        return (this.authService.getUserProp('email').toLowerCase() === this.currentRequestApproval.requesterEmail.toLowerCase());
    }

    userIsOnBehalfUser() {
        return (this.currentRequestApproval.onBehalfEmail &&
                (this.authService.getUserProp('email').toLowerCase() === this.currentRequestApproval.onBehalfEmail.toLowerCase()));
    }

    confirmedCancel() {
        this.requestService.submitUpdate<any>('request', 'cancel',
                                               this.currentRequestApproval.baseInfo.requestId).subscribe(
            event => {
                if (event.type === HttpEventType.UploadProgress) {
                    console.log('cancel request responded: ', event.loaded);
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
                // this.router.navigate(['/requests/request-stage', this.currentRequestApproval.baseInfo.id]);
                this.getCurrentRequest();
            }
        );
    }

}
