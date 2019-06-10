import { Component, OnInit } from '@angular/core';
import { RequestResponse } from '../../domain/operation';
import { paymentStages, requesterPositions, requestTypes,
         statusNamesMap, supplierSelectionMethodsMap } from '../../domain/stageDescriptions';
import { RequestInfo } from '../../domain/requestInfoClasses';
import { AnchorItem } from '../../shared/dynamic-loader-anchor-components/anchor-item';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageRequestsService } from '../../services/manage-requests.service';
import { AuthenticationService } from '../../services/authentication.service';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { printRequestPage } from '../print-request-function';
import { mergeMap, tap } from 'rxjs/operators';

declare var UIkit: any;

@Component({
    selector: 'app-request-stage-payment',
    templateUrl: './request-stage-payment.component.html'
})
export class RequestStagePaymentComponent implements OnInit {
    errorMessage: string;
    notFoundMessage: string;
    successMessage: string;
    showSpinner: boolean;

    isSimpleUser: boolean;
    requestId: string;
    currentRequestPayment: RequestResponse;
    totalPaymentsOfRequest: number;
    stages: string[] = paymentStages;
    reqPositions = requesterPositions;
    selMethods = supplierSelectionMethodsMap;
    stateNames = statusNamesMap;
    reqTypes = requestTypes;

    currentRequestInfo: RequestInfo;

    stageLoaderAnchorItem: AnchorItem;
    prevStageLoaderAnchorItem: AnchorItem;

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
        this.currentRequestPayment = null;
        this.currentRequestInfo = null;
        this.stageLoaderAnchorItem = null;
        this.totalPaymentsOfRequest = 0;
    }

    getCurrentRequest() {
        this.showSpinner = true;
        this.errorMessage = '';
        this.notFoundMessage = '';

        const result = this.requestService.getRequestPaymentById(this.requestId).pipe(
            tap(res => this.currentRequestPayment = res),
            mergeMap( res =>
                this.requestService.getPaymentsOfRequest(res.baseInfo.requestId)
            ));

        /* get request info */
        result.subscribe(
            req => {
                this.totalPaymentsOfRequest = req.total;
                console.log(`total payments are: ${this.totalPaymentsOfRequest}`);
            },
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
                this.currentRequestInfo = new RequestInfo(this.currentRequestPayment.baseInfo.id,
                                                          this.currentRequestPayment.baseInfo.requestId);
                this.findPreviousStage();
                this.checkIfStageIs7(this.currentRequestPayment.baseInfo.stage);
                this.showSpinner = false;
                this.updateShowStageFields();
                window.scrollTo(1, 1);
            }
        );
    }

    // detects previous stage and checks if the current user has permission to edit it
    findPreviousStage() {
        if (((this.currentRequestPayment.baseInfo.status === 'PENDING') ||
             (this.currentRequestPayment.baseInfo.status === 'UNDER_REVIEW')) &&
            (this.currentRequestPayment.baseInfo.stage !== '7')) {

            const i = this.stages.indexOf(this.currentRequestPayment.baseInfo.stage);
            if (i > -1) {
                let prevStage: string;

                for (const p of this.currentRequestInfo[ this.stages[i] ].prev) {
                    if (this.currentRequestPayment.stages[p] != null) {
                        prevStage = p;
                        break;
                    }
                }

                if ((prevStage != null) && ((this.currentRequestPayment.canEditPrevious === true) || (this.userIsAdmin()))) {

                    this.currentRequestInfo.previousStage = prevStage;
                }
            }
        }
    }

    checkIfStageIs7(stage: string) {
        if ( (stage === '7') &&
             ((this.currentRequestPayment.type === 'REGULAR') || (this.currentRequestPayment.type === 'TRIP')) ) {

            this.currentRequestInfo.finalAmount = '';
            if ( this.currentRequestPayment.stages['1']['finalAmount'] ) {
                this.currentRequestInfo.finalAmount = (this.currentRequestPayment.stages['1']['finalAmount']).toString();
            }
        }
    }

    getSubmittedStage(submittedData: any[]) {
        this.updateRequest(submittedData[0], submittedData[1]);
    }

    getFinalAmount(newVals: string[]) {
        if (newVals && newVals.length === 1) {
            this.currentRequestPayment.stages['1']['finalAmount'] = +newVals[0];
        }
    }

    updateRequest(mode: string, submitted: FormData) {
        window.scrollTo(0, 0);
        this.showSpinner = true;
        this.errorMessage = '';
        this.successMessage = '';
        if ((this.currentRequestPayment.baseInfo.stage === '7') ||
            ((mode === 'edit') && (this.currentRequestInfo.previousStage != null) && (this.currentRequestInfo.previousStage === '7'))) {
            submitted.append('finalAmount', this.currentRequestPayment.stages['1']['finalAmount'].toString());
        }
        this.requestService.submitUpdate<any>('payment', mode, this.currentRequestPayment.baseInfo.id, submitted).subscribe(
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


    editPreviousStage(showForm: boolean) {
        // if the previous stage cannot be editted this.currentRequestInfo.previousStage will be undefined -- see findPreviousStage()
        if (this.currentRequestInfo.previousStage != null) {
            const prevStage = this.currentRequestInfo.previousStage;
            if (showForm === true) {
                // send data to the form component
                this.checkIfStageIs7(this.currentRequestInfo.previousStage);
                this.prevStageLoaderAnchorItem = new AnchorItem(
                    this.currentRequestInfo[prevStage]['stageComponent'],
                    {
                        currentStage: this.currentRequestPayment.stages[prevStage],
                        currentRequestInfo: this.currentRequestInfo
                    }
                );
                this.currentRequestInfo[prevStage].showStage = 1;
            } else {
                this.currentRequestInfo[prevStage].showStage = this.willShowStage(prevStage);
                this.prevStageLoaderAnchorItem = null;
            }
        }
    }

    updateShowStageFields() {
        for ( let i = 0; i < this.stages.length; i++ ) {
            this.currentRequestInfo[this.stages[i]].showStage = this.willShowStage(this.stages[i]);
        }
    }

    willShowStage(stage: string) {
        /* return values:  0 -> don't show
                           1 -> show form
                           2 -> was approved
                           3 -> was rejected
                           4 -> was returned to previous*/
        if ( (stage === this.currentRequestPayment.baseInfo.stage) &&
            (this.currentRequestPayment.baseInfo.status !== 'REJECTED') &&
            (this.currentRequestPayment.baseInfo.status !== 'ACCEPTED') &&
            (this.currentRequestPayment.baseInfo.status !== 'CANCELLED') &&
            ( this.userIsAdmin() || (this.currentRequestPayment.canEdit === true) ) ) {

            if (this.currentRequestPayment.stages[stage] == null) {
                this.currentRequestPayment.stages[stage] = this.currentRequestInfo.createNewStageObject(stage);
            }
            this.stageLoaderAnchorItem = new AnchorItem(
                    this.currentRequestInfo[stage]['stageComponent'],
                    {
                        currentStage: this.currentRequestPayment.stages[stage],
                        currentRequestInfo: this.currentRequestInfo
                    }
                );

            return 1;

        } else {
            if (stage === '1') {
                return 2;
            }
            if ( (this.currentRequestPayment.stages[stage]) && (this.currentRequestPayment.stages[stage].date) ) {
                if ( !this.isSimpleUser || (stage === '7') ) {
                    if ( this.stages.indexOf(this.currentRequestPayment.baseInfo.stage) < this.stages.indexOf(stage)) {
                        return 4;
                    }

                    if ( (stage === this.currentRequestPayment.baseInfo.stage) && (this.stages.indexOf(stage) > 0) ) {

                        // const prevStage = this.stages[this.stages.indexOf(stage) - 1];
                        let prevStage;
                        for (const p of this.currentRequestInfo[stage].prev) {
                            if (this.currentRequestPayment.stages[p] != null) {
                                prevStage = p;
                                break;
                            }
                        }
                        if ( (this.currentRequestPayment.stages[prevStage]) &&
                             (this.currentRequestPayment.stages[prevStage].date) &&
                             (this.currentRequestPayment.stages[prevStage].date > this.currentRequestPayment.stages[stage].date) ) {

                            return 4;
                        }
                    }

                    if ( ((this.currentRequestPayment.stages[stage]['approved']) &&
                          this.currentRequestPayment.stages[stage]['approved'] === true ) ||
                          (stage === '11') ) {

                        return 2;

                    } else {
                        return 3;
                    }
                }
            }
        }

        return 0;
    }

    canBeCancelled() {
        if (this.userIsAdmin() || this.userIsRequester() || this.userIsOnBehalfUser()) {
            return ((this.currentRequestPayment.baseInfo.status === 'PENDING') ||
                    (this.currentRequestPayment.baseInfo.status === 'UNDER_REVIEW'));
        }
        return false;
    }

    userIsAdmin() {
        return (this.authService.getUserRole().some(x => x.authority === 'ROLE_ADMIN'));
    }

    userIsRequester() {
        return (this.authService.getUserProp('email').toLowerCase() === this.currentRequestPayment.requesterEmail.toLowerCase());
    }

    userIsOnBehalfUser() {
        return (this.currentRequestPayment.onBehalfEmail &&
                (this.authService.getUserProp('email').toLowerCase() === this.currentRequestPayment.onBehalfEmail.toLowerCase()));
    }

    confirmedCancel(cancelWholeRequest: boolean) {
        window.scrollTo(0, 0);
        this.showSpinner = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.requestService.cancelRequestPayment(this.currentRequestPayment.baseInfo.id, cancelWholeRequest).subscribe(
            res => {
                console.log('cancel payment responded: ', JSON.stringify(res));
                this.errorMessage = '';
                this.showSpinner = false;
                UIkit.modal('#cancellationModal').hide();
                if (cancelWholeRequest) {
                    this.router.navigate([ '/requests' ]);
                } else {
                    window.location.href = '/requests/request-stage/' + this.currentRequestPayment.baseInfo.requestId + '-a1';
                }
            },
            error => {
                console.log(error);
                this.showSpinner = false;
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την αποθήκευση των αλλαγών.';
                UIkit.modal('#cancellationModal').hide();
                window.scrollTo(1, 1);
            }
        );
    }


    linkToFile(fileIndex: number) {
        if (this.currentRequestPayment.stages['1'].attachments &&
            this.currentRequestPayment.stages['1'].attachments[fileIndex] &&
            this.currentRequestPayment.stages['1'].attachments[fileIndex].url) {

            let url = `${window.location.origin}/arc-expenses-service/request/store?`;
            url = `${url}archiveId=${encodeURIComponent(this.currentRequestPayment.stages['1'].attachments[fileIndex].url)}`;
            url = `${url}&id=${this.currentRequestPayment.baseInfo.requestId}-a1`;
            url = `${url}&mode=approval`;

            window.open(url, '_blank');
        }
    }

    printRequest(): void {
        printRequestPage(this.currentRequestPayment.baseInfo.id);
    }

}
