/*
* created by myrto on 11/6/2019
* */
import { Component, OnInit } from '@angular/core';
import { budgetStages, budgetStageTitles, statesList } from '../domain/stageDescriptions';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { YearlyBudgetSummary } from '../domain/operation';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageBudgetsService } from '../services/manage-budgets.service';

@Component({
    selector: 'app-budgets',
    templateUrl: './budgets.component.html'
})
export class BudgetsComponent implements OnInit {

    title = 'Ετήσιες δαπάνες έργων';

    /* notifications */
    errorMessage: string;
    showSpinner: boolean;
    noBudgets: string;

    /* data */
    stateNames = { all: 'Όλα', pending: 'Σε εξέλιξη', under_review: 'Σε εξέλιξη',
        rejected: 'Απορριφθέντα', accepted: 'Ολοκληρωθέντα', cancelled: 'Ακυρωθέντα'};
    stages: string[] = [];
    stagesMap = budgetStageTitles;
    extraFiltersTranslation = {projectAcronym: 'έργο', institute: 'ινστιτούτο/μονάδα', submittedBy: 'χειριστής', year: 'έτος'};

    /* flags */
    editableSelected: boolean;
    myBudgetsSelected: boolean;
    allStatusSelected: boolean;
    allStagesSelected: boolean;

    /* search params and relevant vars */
    searchTerm: string;
    statusesChoice: string[] = [];
    stagesChoice: string[] = [];
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
    listOfBudgets: YearlyBudgetSummary[] = [];

    constructor(private route: ActivatedRoute,
                private router: Router,
                private fb: FormBuilder,
                private budgetService: ManageBudgetsService) { }

    ngOnInit(): void {
        this.readParams();
    }

    initializeParams() {
        this.statusesChoice = [ 'pending', 'under_review' ];
        this.stagesChoice = [ 'all' ];
        this.extraFilters = new Map<string, string>();

        this.searchTerm = '';
        this.keywordField = this.fb.group({keyword: [ '' ]});

        this.stages = budgetStages;

        this.currentPage = 0;
        this.itemsPerPage = 10;

        this.order = 'DSC';
        this.orderField = 'creation_date';
        this.totalPages = 0;

        this.editableSelected = false;
        this.myBudgetsSelected = false;
    }

    clearFilters() {
        this.initializeParams();
        this.createSearchUrl();
    }

    readParams() {
        this.route.queryParamMap.subscribe(
            params => {
                this.initializeParams();

                if ( params.has('status') ) { this.statusesChoice = params.getAll('status'); }
                if ( params.has('stage') ) { this.stagesChoice = params.getAll('stage'); }
                if (this.stagesChoice[0] && this.stagesChoice[0] === 'all') {
                    this.stagesChoice = this.stages;
                }
                if ( params.has('projectAcronym') ) { this.extraFilters.set('projectAcronym', params.get('projectAcronym')); }
                if ( params.has('institute') ) { this.extraFilters.set('institute', params.get('institute')); }
                if ( params.has('submittedBy') ) { this.extraFilters.set('submittedBy', params.get('submittedBy')); }
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
                if ( params.has('isMine') ) { this.myBudgetsSelected = (params.get('isMine') === 'true'); }

                this.initializeFiltersForm();
                this.getListOfBudgets();
            }
        );
    }

    initializeFiltersForm() {
        this.filtersForm = this.fb.group({
            statusChoices: this.createFormArray({status: [false]}, 4),
            stageChoices: this.createFormArray({stage: [false]}, this.stages.length),
        });
    }
    get stageChoices(): FormArray {
        return this.filtersForm.get('stageChoices') as FormArray;
    }

    createFormArray(def: any, length: number) {
        const newArray = this.fb.array([]);
        for (let i = 0; i < length; i++) {
            newArray.push(this.fb.group(def));
        }
        return <FormArray>newArray;
    }

    setValueOfFormArrayControl(formArrayName: string, index: number, fieldName: string, val: any) {
        const tempFormArray = this.filtersForm.get(formArrayName) as FormArray;
        tempFormArray.at(index).get(fieldName).setValue(val);
    }

    setFormValues() {
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
    }


    /* get the yearlyBudgets list according to the current params */
    getListOfBudgets() {
        this.noBudgets = '';
        this.errorMessage = '';
        this.listOfBudgets = [];
        this.showSpinner = true;
        const currentOffset = this.currentPage * this.itemsPerPage;

        let finalStatuses = this.statusesChoice;
        if ((finalStatuses.length === 1) && (finalStatuses[0] === 'all')) {
            finalStatuses = statesList;
        }
        let finalStages = this.stagesChoice;
        if ((finalStages.length === 1) && (finalStages[0] === 'all')) {
            finalStages = this.stages;
        }
        const editable = this.editableSelected ? 'true' : 'false';
        const isMine = this.myBudgetsSelected ? 'true' : 'false';

        this.budgetService.getAllBudgets(this.searchTerm, finalStatuses, finalStages,
            currentOffset.toString(),
            this.itemsPerPage.toString(),
            this.order,
            this.orderField,
            editable,
            isMine,
            this.extraFilters).subscribe(
            res => {
                if (res && res.results &&
                    res.results.length > 0 &&
                    !res.results.some(x => x === null)) {

                    this.listOfBudgets = res.results;
                    console.log(`searchAllRequests sent me ${this.listOfBudgets.length} budgets`);
                    console.log(`total requests are ${res.total}`);
                    this.totalPages = Math.ceil(res.total / this.itemsPerPage);
                }
            },
            error => {
                console.log(error);
                this.errorMessage = 'Παρουσιάστηκε πρόβλημα.';
                this.showSpinner = false;
                this.totalPages = 0;
                window.scrollTo(1, 1);
            },
            () => {
                this.showSpinner = false;
                this.errorMessage = '';
                if (this.listOfBudgets.length === 0) {
                    this.noBudgets = 'Δεν βρέθηκαν σχετικά αποτελέσματα.';
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


    chooseStage() {
        this.getStageChoices();
        console.log('after getStageChoices list is', JSON.stringify(this.stagesChoice));
        this.currentPage = 0;
        this.createSearchUrl();
    }

    chooseState() {
        this.getStatusChoices();
        console.log('after getStatusChoices list is', JSON.stringify(this.statusesChoice));
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
        this.myBudgetsSelected = event.target.checked;
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

    setChoices(val: boolean, arrayName: string, controlName: string) {
        const formArray = <FormArray>this.filtersForm.controls[arrayName];
        formArray.controls.map( x => x.get(controlName).setValue(val) );
    }

    setAllStageValues(val: boolean) {
        this.allStagesSelected = val;
        this.setChoices(val, 'stageChoices', 'stage');
        this.stagesChoice = [];
        this.stagesChoice.push('all');
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

    getStageChoices() {
        this.allStagesSelected = null;
        this.stagesChoice = [];
        const stageChoices = <FormArray>this.filtersForm.controls['stageChoices'];
        stageChoices.controls.map( (x, i) => { if ( x.get('stage').value ) { this.stagesChoice.push(this.stages[i]); } });
        if ((this.stagesChoice.length === 0) || (this.stagesChoice.length === this.stages.length)) {
            this.allStagesSelected = (this.stagesChoice.length === this.stages.length);
            this.stagesChoice = [];
            this.stagesChoice.push('all');
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

        const isMineValue = (this.myBudgetsSelected ? 'true' : 'false');
        url.set('isMine', isMineValue);

        this.router.navigateByUrl(`/budgets?${url.toString()}`);
    }

}
