import { Component, OnInit } from '@angular/core';
import { RequestSummary } from '../domain/operation';
import { ManageRequestsService } from '../services/manage-requests.service';
import { AuthenticationService } from '../services/authentication.service';
import { Paging } from '../domain/extraClasses';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { approvalStages, paymentStages, requestTypes, stageTitles, statesList } from '../domain/stageDescriptions';
import { ManageResourcesService } from '../services/manage-resources.service';
import { ManageProjectService } from '../services/manage-project.service';

@Component({
    selector: 'app-requests',
    templateUrl: './requests.component.html',
    styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {

    title = 'Υπάρχοντα Αιτήματα';

    /* notifications */
    errorMessage: string;
    showSpinner: boolean;
    noRequests: string;

    /* data */
    stateNames = { all: 'Όλα', pending: 'Σε εξέλιξη', under_review: 'Σε εξέλιξη',
                   rejected: 'Απορριφθέντα', accepted: 'Ολοκληρωθέντα', cancelled: 'Ακυρωθέντα'};
    stages: string[] = [];
    stagesMap = stageTitles;
    reqTypes = requestTypes;
    requestTypeIds = ['regular', 'contract', 'services_contract', 'trip'];
    extraFiltersTranslation = {projectAcronym: 'έργο', institute: 'ινστιτούτο/μονάδα', requester: 'αιτών'};

    /* flags */
    isSimpleUser: boolean;
    editableSelected: boolean;
    myRequestsSelected: boolean;
    allStatusSelected: boolean;
    allStagesSelected: boolean;
    allPhasesSelected: boolean;
    allTypesSelected: boolean;

    /* search params and relevant vars */
    phaseId: number;
    searchTerm: string;
    statusesChoice: string[] = [];
    stagesChoice: string[] = [];
    typesChoice: string[] = [];
    order: string;
    orderField: string;
    extraFilters: Map<string, string>;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;

    /* forms */
    keywordField: FormGroup;
    filtersForm: FormGroup;

    /* search result vars */
    searchResults: Paging<RequestSummary>;
    listOfRequests: RequestSummary[] = [];

    constructor(private requestService: ManageRequestsService,
                private resourceService: ManageResourcesService,
                private projectService: ManageProjectService,
                private authService: AuthenticationService,
                private router: Router,
                private route: ActivatedRoute,
                private fb: FormBuilder) {}

    ngOnInit() {
        this.isSimpleUser = (this.authService.getUserRole().some(x => x['authority'] === 'ROLE_USER') &&
                             (this.authService.getUserRole().length === 1));

        this.readParams();
    }

    initializeParams() {
        this.statusesChoice = [ 'pending', 'under_review' ];
        this.stagesChoice = [ 'all' ];
        this.typesChoice = [ 'all' ];
        this.extraFilters = new Map<string, string>();

        this.searchTerm = '';
        this.keywordField = this.fb.group({keyword: [ '' ]});

        this.phaseId = 0;
        this.stages = approvalStages.concat(paymentStages);

        this.currentPage = 0;
        this.itemsPerPage = 10;

        this.order = 'DSC';
        this.orderField = 'creation_date';
        this.totalPages = 0;

        this.editableSelected = false;
        this.myRequestsSelected = false;

        this.createSearchUrl();

    }

    readParams() {
        this.route.queryParamMap.subscribe(
            params => {
                this.statusesChoice = [ 'pending', 'under_review' ];
                this.stagesChoice = [ 'all' ];
                this.typesChoice = [ 'all' ];
                this.extraFilters = new Map<string, string>();

                this.searchTerm = '';
                this.keywordField = this.fb.group({keyword: [ '' ]});

                this.phaseId = 0;
                this.stages = approvalStages.concat(paymentStages);

                this.currentPage = 0;
                this.itemsPerPage = 10;

                this.order = 'DSC';
                this.orderField = 'creation_date';
                this.totalPages = 0;

                this.editableSelected = false;
                this.myRequestsSelected = false;

                if ( params.has('status') ) { this.statusesChoice = params.getAll('status'); }
                if ( params.has('stage') ) { this.stagesChoice = params.getAll('stage'); }
                if ( params.has('phase') && !isNaN(+params.get('phase')) ) {
                    this.phaseId = +params.get('phase');
                    if (this.phaseId === 0) {
                        this.stages = approvalStages.concat(paymentStages);
                    } else if (this.phaseId === 1) {
                        this.stages = approvalStages;
                        if (this.stagesChoice[0] && this.stagesChoice[0] === 'all') {
                            this.stagesChoice = this.stages;
                        }
                    } else {
                        this.stages = paymentStages;
                        if (this.stagesChoice[0] && this.stagesChoice[0] === 'all') {
                            this.stagesChoice = this.stages;
                        }
                    }
                }
                if ( params.has('type') ) { this.typesChoice = params.getAll('type'); }
                if ( params.has('projectAcronym') ) { this.extraFilters.set('projectAcronym', params.get('projectAcronym')); }
                if ( params.has('institute') ) { this.extraFilters.set('institute', params.get('institute')); }
                if ( params.has('requester') ) { this.extraFilters.set('requester', params.get('requester')); }
                if ( params.has('searchTerm') ) {
                    this.searchTerm = params.get('searchTerm');
                    this.keywordField.get('keyword').setValue(this.searchTerm);
                }
                if ( params.has('page') && !isNaN(+params.get('page')) ) {
                    this.currentPage = +params.get('page');
                }
                if ( params.has('itemsPerPage') && !isNaN(+params.get('itemsPerPage'))) {
                    this.itemsPerPage = +params.get('itemsPerPage');
                }
                if ( params.has('orderField') ) { this.orderField = params.get('orderField'); }
                if ( params.has('order') ) { this.order = params.get('order'); }
                if ( params.has('editable') ) { this.editableSelected = (params.get('editable') === 'true'); }
                if ( params.has('isMine') ) { this.myRequestsSelected = (params.get('isMine') === 'true'); }

                this.initializeFiltersForm();
                this.getListOfRequests();
            }
        );
    }

    initializeFiltersForm() {
        this.filtersForm = this.fb.group({
            phases: this.createFormArray({phase: [false]}, 2),
            statusChoices: this.createFormArray({status: [false]}, 4),
            stageChoices: this.createFormArray({stage: [false]}, this.stages.length),
            typeChoices: this.createFormArray({type: [false]}, this.requestTypeIds.length)
        });
    }

    setFormValues() {
        if (this.phaseId !== 0) {
            this.setValueOfFormArrayControl('phases', this.phaseId - 1, 'phase', true);
        } else {
            if (this.allPhasesSelected) {
                this.setValueOfFormArrayControl('phases', 0, 'phase', true);
                this.setValueOfFormArrayControl('phases', 1, 'phase', true);
            }
        }
        if ( this.statusesChoice[0] ) {
          if (this.statusesChoice[0] !== 'all') {
                this.statusesChoice.forEach(
                    st => {
                        let i: number;
                        if ( (st === 'pending') || (st === 'under_review') ) {
                            i = 0;
                        } else if ( st === 'rejected' ) {
                            i = 1;
                        } else if ( st === 'accepted' ) {
                            i = 2;
                        } else {
                            i = 3;
                        }

                        this.setValueOfFormArrayControl('statusChoices', i, 'status', true);
                    }
                );
            } else {
                if (this.allStatusSelected) {
                    for (let i = 0; i < 4; i++) {
                        this.setValueOfFormArrayControl('statusChoices', i, 'status', true);
                    }
                }
            }
        }
        if ( this.stagesChoice[0] ) {
            if ((this.stagesChoice[0] !== 'all') && (this.stagesChoice.length !== this.stages.length)) {
                this.stagesChoice.forEach(
                    st => {
                        const i = this.stages.indexOf(st);
                        if ( i > -1 ) {
                            this.setValueOfFormArrayControl('stageChoices', i, 'stage', true);
                        }
                    }
                );
            } else {
                if (this.allStagesSelected) {
                    for (let i = 0; i < this.stages.length; i++) {
                        this.setValueOfFormArrayControl('stageChoices', i, 'stage', true);
                    }
                }
            }
        }
        if ( this.typesChoice[0] ) {
            if (this.typesChoice[0] !== 'all') {
                this.typesChoice.forEach(
                    t => {
                        const i = this.requestTypeIds.indexOf(t);
                        if ( i > -1 ) {
                            this.setValueOfFormArrayControl('typeChoices', i, 'type', true);
                        }
                    }
                );
            } else {
                if (this.allTypesSelected) {
                    for (let i = 0; i < this.requestTypeIds.length; i++) {
                        this.setValueOfFormArrayControl('typeChoices', i, 'type', true);
                    }
                }
            }
        }

    }

    setValueOfFormArrayControl(formArrayName: string, index: number, fieldName: string, val: any) {
        const tempFormArray = this.filtersForm.get(formArrayName) as FormArray;
        tempFormArray.at(index).get(fieldName).setValue(val);
    }

    createFormArray(def: any, length: number) {
        const newArray = this.fb.array([]);
        for (let i = 0; i < length; i++) {
            newArray.push(this.fb.group(def));
        }
        return <FormArray>newArray;
    }

    /* get the requestSummaries list according to the current params */
    getListOfRequests() {
        this.noRequests = '';
        this.errorMessage = '';
        this.listOfRequests = [];
        this.showSpinner = true;
        const currentOffset = this.currentPage * this.itemsPerPage;

        let finalStatuses = this.statusesChoice;
        if ((finalStatuses.length === 1) && (finalStatuses[0] === 'all')) {
            finalStatuses = statesList;
        }
        let finalTypes = this.typesChoice;
        if ((finalTypes.length === 1) && (finalTypes[0] === 'all')) {
            finalTypes = this.requestTypeIds;
        }
        let finalStages = this.stagesChoice;
        if ((finalStages.length === 1) && (finalStages[0] === 'all')) {
            finalStages = this.stages;
        }
        const editable = this.editableSelected ? 'true' : 'false';
        const isMine = this.myRequestsSelected ? 'true' : 'false';

        this.requestService.searchAllRequestSummaries(this.searchTerm,
                                                      finalStatuses,
                                                      finalTypes,
                                                      finalStages,
                                                      currentOffset.toString(),
                                                      this.itemsPerPage.toString(),
                                                      this.order,
                                                      this.orderField,
                                                      editable,
                                                      isMine,
                                                      this.extraFilters).subscribe(
            res => {
                if (res) {
                    this.searchResults = res;
                    if (this.searchResults && this.searchResults.results &&
                        this.searchResults.results.length > 0 &&
                        !this.searchResults.results.some(x => x === null)) {

                        this.listOfRequests = this.searchResults.results;
                        console.log(`searchAllRequests sent me ${this.listOfRequests.length} requests`);
                        console.log(`total requests are ${this.searchResults.total}`);
                        console.log(this.listOfRequests);
                        this.totalPages = Math.ceil(this.searchResults.total / this.itemsPerPage);
                    }
                }
            },
            error => {
                console.log(error);
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα με την φόρτωση των αιτημάτων';
                this.showSpinner = false;
                this.totalPages = 0;
                window.scrollTo(1, 1);
            },
            () => {
                this.showSpinner = false;
                this.errorMessage = '';
                if (this.listOfRequests.length === 0) {
                    this.noRequests = 'Δεν βρέθηκαν σχετικά αιτήματα.';
                }
                this.setFormValues();
                window.scrollTo(1, 1);
            }
        );
    }

    getExtraFiltersKeys() {
        if (this.extraFilters) {
            return Array.from(this.extraFilters.keys());
        }
        return [];
    }

    sortBy (category: string) {
        if (this.orderField && this.orderField === category) {
            this.toggleOrder();
        } else {
            this.order = 'ASC';
            this.orderField = category;
        }
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleOrder() {
        if (this.order === 'ASC') {
            this.order = 'DSC';
        } else {
            this.order = 'ASC';
        }
        this.currentPage = 0;
    }

    getOrderSign() {
        if (this.order === 'ASC') {
            return '&#9652;';
        } else {
            return '&#9662;';
        }
    }

    goToPreviousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.createSearchUrl();
        }
    }

    goToNextPage() {
        if ( (this.currentPage + 1) < this.totalPages) {
            this.currentPage++;
            this.createSearchUrl();
        }
    }

    getItemsPerPage(event: any) {
        this.itemsPerPage = event.target.value;
        this.currentPage = 0;
        this.createSearchUrl();
    }

    choosePhase() {
        this.getPhaseId();
        this.stages = [];
        this.stagesChoice = [];
        if (this.phaseId === 0) {
            this.stages = approvalStages.concat(paymentStages);
        } else if (this.phaseId === 1) {
            this.stages = approvalStages;
        } else {
            this.stages = paymentStages;
        }
        this.setAllStageValues(false);
        this.initFormArray('stageChoices', { stage: [false] }, this.stages.length);
        this.currentPage = 0;
        this.createSearchUrl();
    }

    initFormArray(arrayName: string, definition: any, length: number) {
        const formArray = <FormArray>this.filtersForm.controls[arrayName];
        formArray.controls = [];
        for (let i = 0; i < length; i++) {
            formArray.push(this.fb.group(definition));
        }
        console.log('formArray length is', formArray.length);
    }


    chooseStage() {
        if ( !this.isSimpleUser ) {
            this.getStageChoices();
            console.log('after getStageChoices list is', JSON.stringify(this.stagesChoice));
            this.currentPage = 0;
            this.createSearchUrl();
        }
    }

    chooseState() {
        this.getStatusChoices();
        console.log('after getStatusChoices list is', JSON.stringify(this.statusesChoice));
        this.currentPage = 0;
        this.createSearchUrl();
    }

    chooseType() {
        this.getTypeChoices();
        console.log('after getTypeChoices list is', JSON.stringify(this.typesChoice));
        this.currentPage = 0;
        this.createSearchUrl();
    }

    addExtraFilter(searchParams: string[]) {
        if (searchParams.length === 2) {
            const key = searchParams[ 0 ];
            const value = searchParams[ 1 ];
            this.extraFilters.set(key, value);
            this.currentPage = 0;
            this.createSearchUrl();
        }
    }

    removeExtraFilter(key: string) {
        this.extraFilters.delete(key);
        this.currentPage = 0;
        this.createSearchUrl();
    }

    getSearchByKeywordResults() {
        this.searchTerm = this.keywordField.get('keyword').value;
        console.log('this.searchTerm is', this.searchTerm);
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleEditable(event: any) {
        this.editableSelected = event.target.checked;
        if (this.editableSelected) {
            this.statusesChoice = ['pending', 'under_review'];
        }
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleIsMine(event: any) {
        this.myRequestsSelected = event.target.checked;
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleSearchAllPhases(event: any) {
        this.setAllPhaseValues(event.target.checked);
        this.setAllStageValues(false);
        this.stages = [];
        this.stages = approvalStages.concat(paymentStages);
        this.initFormArray('stageChoices', { stage: [false]}, this.stages.length);
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleSearchAllStages(event: any) {
        this.setAllStageValues(event.target.checked);
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleSearchAllStatuses(event: any) {
        this.setAllStatusValues(event.target.checked);
        this.currentPage = 0;
        this.createSearchUrl();
    }

    toggleSearchAllTypes(event: any) {
        this.allTypesSelected = event.target.checked;
        this.setChoices(event.target.checked, 'typeChoices', 'type');
        this.typesChoice = [];
        this.typesChoice.push('all');
        this.currentPage = 0;
        this.createSearchUrl();
    }

    setChoices(val: boolean, arrayName: string, controlName: string) {
        const formArray = <FormArray>this.filtersForm.controls[arrayName];
        formArray.controls.map( x => x.get(controlName).setValue(val) );
    }

    setAllPhaseValues(val: boolean) {
        this.allPhasesSelected = val;
        this.phaseId = 0;
        const phases = <FormArray>this.filtersForm.controls['phases'];
        phases.controls.map(x => x.get('phase').setValue(val));
    }

    setAllStageValues(val: boolean) {
        this.allStagesSelected = val;
        this.setChoices(val, 'stageChoices', 'stage');
        this.stagesChoice = [];
        if (this.phaseId === 0) {
            this.stagesChoice.push('all');
        } else if (this.phaseId === 1) {
            this.stagesChoice = approvalStages;
        } else {
            this.stagesChoice = paymentStages;
        }
    }

    setAllStatusValues(val: boolean) {
        this.allStatusSelected = val;
        const statusChoices = <FormArray>this.filtersForm.controls['statusChoices'];
        statusChoices.controls.map(x => x.get('status').setValue(val));
        this.statusesChoice = [];
        this.statusesChoice.push('all');
    }

    getChoicesIndices(arrayName: string, controlName: string) {
        const formArray = <FormArray>this.filtersForm.controls[arrayName];
        const choicesIndices = [];
        formArray.controls.map( (x, i) => { if ( x.get(controlName).value ) { choicesIndices.push(i); } } );
        return choicesIndices;
    }

    getPhaseId() {
        this.allPhasesSelected = null;
        this.phaseId = 0;
        const phases = <FormArray>this.filtersForm.controls['phases'];
        if ( phases.at(0).get('phase').value ) {
            this.phaseId = 1;
        }
        if ( phases.at(1).get('phase').value ) {
            if (this.phaseId === 1) {
                this.phaseId = 0;
                this.allPhasesSelected = true;
            } else {
                this.phaseId = 2;
            }
        }
        console.log('phaseId is', this.phaseId);
    }

    getStageChoices() {
        if ( !this.isSimpleUser ) {
            this.allStagesSelected = null;
            this.stagesChoice = [];
            const stageChoices = <FormArray>this.filtersForm.controls['stageChoices'];
            stageChoices.controls.map( (x, i) => { if ( x.get('stage').value ) { this.stagesChoice.push(this.stages[i]); } });
            if ((this.stagesChoice.length === 0) || (this.stagesChoice.length === this.stages.length)) {
                this.allStagesSelected = (this.stagesChoice.length === this.stages.length);
                this.stagesChoice = [];
                if (this.phaseId === 0) {
                    this.stagesChoice.push('all');
                } else if (this.phaseId === 1) {
                    this.stagesChoice = approvalStages;
                } else {
                    this.stagesChoice = paymentStages;
                }
            }
        }
    }

    getStatusChoices() {
        this.allStatusSelected = null;
        this.statusesChoice = [];
        const statusChoices = <FormArray>this.filtersForm.controls['statusChoices'];
        if ( statusChoices.at(0).get('status').value ) {
            this.statusesChoice.push('pending');
            this.statusesChoice.push('under_review');
        }
        if ( statusChoices.at(1).get('status').value ) {
            this.statusesChoice.push('rejected');
        }
        if ( statusChoices.at(2).get('status').value ) {
            this.statusesChoice.push('accepted');
        }
        if ( statusChoices.at(3).get('status').value ) {
            this.statusesChoice.push('cancelled');
        }
        if ((this.statusesChoice.length === 0) || (this.statusesChoice.length === 5) ) {
            this.allStatusSelected = (this.statusesChoice.length === 5);
            this.statusesChoice = [];
            this.statusesChoice.push('all');
            console.log(this.allStatusSelected);
        }
    }

    getTypeChoices() {
        this.allTypesSelected = null;
        this.typesChoice = [];
        const typeChoicesIndices = this.getChoicesIndices('typeChoices', 'type');
        if ((typeChoicesIndices.length === 0) || (typeChoicesIndices.length === this.requestTypeIds.length)) {
            this.allTypesSelected = (typeChoicesIndices.length === this.requestTypeIds.length);
            this.typesChoice.push('all');
        } else {
            typeChoicesIndices.forEach( x => this.typesChoice.push(this.requestTypeIds[x]) );
        }
    }

    getStatusAsString( status: string ) {
        if ( (status === 'pending') || (status === 'under_review') ) {
            return 'σε εξέλιξη';
        } else if (status === 'accepted') {
            return 'ολοκληρωθηκε';
        } else if (status === 'rejected') {
            return 'απορρίφθηκε';
        } else {
            return 'ακυρώθηκε';
        }
    }

    createSearchUrl() {
        const url = new URLSearchParams();

        this.searchTerm = this.keywordField.get('keyword').value;
        this.statusesChoice.forEach( st => url.append('status', st) );
        this.stagesChoice.forEach( st => url.append('stage', st) );
        url.set('phase', this.phaseId.toString());
        this.typesChoice.forEach( t => url.append('type', t) );
        if (this.extraFilters) {
            this.extraFilters.forEach(
                (val: string, k: string) => url.set(k, val)
            );
        }
        url.set('searchTerm', this.searchTerm);
        url.set('page', this.currentPage.toString());
        url.set('itemsPerPage', this.itemsPerPage.toString());
        url.set('orderField', this.orderField);
        url.set('order', this.order);

        const editableValue = (this.editableSelected ? 'true' : 'false');
        url.set('editable', editableValue);

        const isMineValue = (this.myRequestsSelected ? 'true' : 'false');
        url.set('isMine', isMineValue);

        this.router.navigateByUrl(`/requests?${url.toString()}`);
    }

}
