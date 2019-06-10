import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project, User, Vocabulary } from '../domain/operation';
import { ManageRequestsService } from '../services/manage-requests.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { DatePipe } from '@angular/common';
import { ManageProjectService } from '../services/manage-project.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { requesterPositions, requestTypes, supplierSelectionMethodsMap } from '../domain/stageDescriptions';

@Component({
    selector: 'app-new-request',
    templateUrl: './new-request.component.html',
    styleUrls: ['./new-request.component.scss']
})
export class NewRequestComponent implements OnInit {

    errorMessage: string;
    showSpinner: boolean;

    requestType: string;
    reqTypes = requestTypes;
    readonly amountLimit = 20000;
    readonly lowAmountLimit = 2500;
    isSupplierRequired = '';

    currentUser: User;

    newRequestForm: FormGroup;

    uploadedFiles: File[];
    uploadedFilenames: string[] = [];

    requestedAmount: string;
    showWarning: boolean;
    searchTerm = '';

    projects: Vocabulary[] = [];
    chosenProgramID: string;

    chosenProject: Project;

    selMethods = supplierSelectionMethodsMap;
    reqPositions = requesterPositions;

    programSelected = false;
    isRequestOnBehalfOfOther;

    title = 'Δημιουργία νέου αιτήματος';

    datePipe = new DatePipe('el');

    constructor(private fb: FormBuilder,
                private requestService: ManageRequestsService,
                private projectService: ManageProjectService,
                private authService: AuthenticationService,
                private router: Router,
                private route: ActivatedRoute) {}


    ngOnInit() {
        this.getUserInfo();
        this.getProjects();
        this.route.paramMap.subscribe(
            param => {
                if (param.has('type')) {
                    this.requestType = param.get('type');
                } else {
                    this.requestType = 'reqular';
                }
                this.requestType = this.requestType.toUpperCase();
                console.log('in new-request, request type is:', this.requestType );
                console.log('current type is:', this.requestType);
                this.title = this.reqTypes[this.requestType];
                this.createForm();
            }
        );
    }

    getUserInfo() {
        this.currentUser = new User();
        this.currentUser.id = this.authService.getUserProp('id');
        this.currentUser.email = this.authService.getUserProp('email');
        this.currentUser.firstname = this.authService.getUserProp('firstname');
        this.currentUser.lastname = this.authService.getUserProp('lastname');
        this.currentUser.firstnameLatin = this.authService.getUserProp('firstnameLatin');
        this.currentUser.lastnameLatin = this.authService.getUserProp('lastnameLatin');
        console.log('this.currentUser is: ', this.currentUser);
    }

    getProjects() {
        this.showSpinner = true;
        this.errorMessage = '';
        this.projects = [];
        this.projectService.getAllProjectsNames().subscribe (
            projects => {
                this.projects = projects;
                console.log(this.projects);
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
        this.newRequestForm = this.fb.group({
            name: [''],
            program: ['', Validators.required],
            institute: [''],
            position: ['', Validators.required],
            requestText: ['', Validators.required],
            supplier: ['', Validators.required],
            supplierSelectionMethod: ['', Validators.required],
            onBehalf_firstname: [''],
            onBehalf_lastname: [''],
            onBehalf_email: [''],
            trip_destination: [''],
            amount: ['', [Validators.required, Validators.min(0), Validators.pattern('^\\d+(\\.\\d{1,2})?$')] ],
            no_of_payments: [0],
            sciCoord: ['']
        });
        this.newRequestForm.get('name').setValue(`${this.currentUser.firstname} ${this.currentUser.lastname}`);
        this.newRequestForm.get('name').disable();

        if (this.requestType === 'TRIP') {
            this.newRequestForm.get('trip_destination').setValidators([Validators.required]);
            this.newRequestForm.get('trip_destination').updateValueAndValidity();
        }
        if (this.requestType === 'SERVICES_CONTRACT') {
            this.newRequestForm.get('no_of_payments').setValidators([Validators.required, Validators.min(1)]);
            this.newRequestForm.get('no_of_payments').updateValueAndValidity();
        }
        if ((this.requestType === 'TRIP') || (this.requestType === 'CONTRACT')) {
            this.newRequestForm.get('supplierSelectionMethod').clearValidators();
            this.newRequestForm.get('supplier').clearValidators();
        }
        if ((this.requestType === 'REGULAR') || (this.requestType === 'SERVICES_CONTRACT')) {
            this.isSupplierRequired = '(*)';
        }
    }

    submitRequest() {
        this.errorMessage = '';
        if (this.newRequestForm.valid ) {
            if ( (+this.newRequestForm.get('amount').value > this.lowAmountLimit) &&
                 (+this.newRequestForm.get('amount').value <= this.amountLimit) &&
                 ( this.newRequestForm.get('supplierSelectionMethod').value === 'DIRECT' ) ) {

                this.errorMessage = 'Για αιτήματα άνω των 2.500 € η επιλογή προμηθευτή γίνεται μέσω διαγωνισμού ή έρευνας αγοράς.';

            } else if ( ( +this.newRequestForm.get('amount').value > this.amountLimit) && this.isRegularOrServicesContract() &&
                        ( this.newRequestForm.get('supplierSelectionMethod').value !== 'AWARD_PROCEDURE' ) ) {

                this.errorMessage = 'Για ποσά άνω των 20.000 € οι αναθέσεις πρέπει να γίνονται μέσω διαγωνισμού.';

            } else if ( this.isRegularOrServicesContract() &&
                        ( (this.newRequestForm.get('supplierSelectionMethod').value !== 'AWARD_PROCEDURE') &&
                          !this.newRequestForm.get('supplier').value )) {

                this.errorMessage = 'Τα πεδία που σημειώνονται με (*) είναι υποχρεωτικά.';

            } else if ( (( this.newRequestForm.get('supplierSelectionMethod').value !== 'DIRECT' ) &&
                           this.isRegularOrServicesContract() ) && ((this.uploadedFiles == null) || (this.uploadedFiles.length === 0)) ) {

                this.errorMessage = 'Για αναθέσεις μέσω διαγωνισμού ή έρευνας αγοράς η επισύναψη εγγράφων είναι υποχρεωτική.';

            } else if ( (this.requestType !== 'SERVICES_CONTRACT') &&
                        (+this.newRequestForm.get('amount').value > this.lowAmountLimit) &&
                        ((this.uploadedFiles == null) || (this.uploadedFiles.length === 0)) ) {

                this.errorMessage = 'Για αιτήματα άνω των 2.500 € η επισύναψη εγγράφων είναι υποχρεωτική.';

            } else {
                const newRequest = new FormData();
                newRequest.append('type', this.requestType);
                newRequest.append('projectId', this.chosenProgramID);
                newRequest.append('requesterPosition', this.newRequestForm.get('position').value);
                newRequest.append('subject', this.newRequestForm.get('requestText').value);
                if ( this.isRegularOrServicesContract() ) {
                    newRequest.append('supplier', this.newRequestForm.get('supplier').value);
                    newRequest.append('supplierSelectionMethod', this.newRequestForm.get('supplierSelectionMethod').value);
                }
                newRequest.append('amountInEuros', this.newRequestForm.get('amount').value);

                if (this.requestType === 'TRIP') {
                    newRequest.append('destination', this.newRequestForm.get('trip_destination').value);
                }
                if (this.requestType === 'SERVICES_CONTRACT') {
                    newRequest.append('paymentCycles', this.newRequestForm.get('no_of_payments').value);
                }
                if (this.isRequestOnBehalfOfOther === true) {
                    newRequest.append('onBehalf', 'true');
                    newRequest.append('firstName', this.newRequestForm.get('onBehalf_firstname').value);
                    newRequest.append('lastName', this.newRequestForm.get('onBehalf_lastname').value);
                    newRequest.append('email', this.newRequestForm.get('onBehalf_email').value);
                }
                if (this.uploadedFiles && (this.uploadedFiles.length > 0)) {
                    for (const file of this.uploadedFiles) {
                        newRequest.append('attachments', file, file.name);
                    }
                }
                this.showSpinner = true;
                this.errorMessage = '';
                this.requestService.add<any>(newRequest).subscribe (
                    event => {
                        if (event.type === HttpEventType.UploadProgress) {
                            console.log('uploadAttachment responded: ', event.loaded);
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
                        this.router.navigate(['/requests']);
                    }
                );
            }

        } else {
            this.errorMessage = 'Τα πεδία που σημειώνονται με (*) είναι υποχρεωτικά.';
            for (const c of Object.keys(this.newRequestForm.getRawValue())) {
                this.newRequestForm.get(c).markAsTouched();
            }
        }
        window.scroll(1, 1);
    }

    getProject() {
        this.errorMessage = '';
        if (this.newRequestForm.get('program').value) {
            this.showSpinner = true;

            this.newRequestForm.get('sciCoord').setValue('');

            this.projectService.getProjectById(this.chosenProgramID).subscribe(
                res => {
                    this.chosenProject = res;
                    console.log(this.chosenProject);
                },
                error => {
                    console.log(error);
                    this.errorMessage = 'Παρουσιάστηκε πρόβλημα με την ανάκτηση των πληροφοριών για το έργο.';
                    this.showSpinner = false;
                    this.searchTerm = '';
                    window.scrollTo(1, 1);
                },
                () => {
                    this.errorMessage = '';
                    if ( this.chosenProject ) {
                        this.programSelected = true;
                        if (this.chosenProject && this.chosenProject.scientificCoordinator) {
                            this.newRequestForm.get('sciCoord').setValue(
                                this.chosenProject.scientificCoordinator.firstname + ' ' +
                                      this.chosenProject.scientificCoordinator.lastname);
                        }
                        this.newRequestForm.get('institute').disable();
                        this.newRequestForm.get('sciCoord').disable();
                    } else {
                        this.errorMessage = 'Παρουσιάστηκε πρόβλημα με την ανάκτηση των πληροφοριών για το έργο.';
                    }
                    this.searchTerm = '';
                    this.showSpinner = false;
                    window.scrollTo(1, 1);
                }
            );
        }
    }

    updateSearchTerm(event: any) {
        this.searchTerm = event.target.value;
        if ( (this.searchTerm === '') &&
             ((this.chosenProject !== undefined) && (this.chosenProject !== null)) ) {
            this.newRequestForm.get('program').setValue('');
            this.newRequestForm.get('institute').setValue('');
            this.newRequestForm.get('sciCoord').setValue('');
            this.newRequestForm.get('institute').enable();
            this.newRequestForm.get('sciCoord').enable();
        }
    }

    updateProgramInput(project: Vocabulary) {
        /*console.log(this.projects);*/
        this.newRequestForm.get('program').setValue(project.projectAcronym);
        this.newRequestForm.get('institute').setValue(`${project.instituteName} (${project.instituteId})`);
        this.chosenProgramID = project.projectID;
        console.log(this.newRequestForm.get('program').value);
        this.getProject();
    }

    getUploadedFiles(files: File[]) {
        this.uploadedFiles = files;
    }

    removeUploadedFile(filename: string) {
        const z = this.uploadedFilenames.indexOf(filename);
        this.uploadedFilenames.splice(z, 1);
        if (this.uploadedFiles && this.uploadedFiles.some(x => x.name === filename)) {
            const i = this.uploadedFiles.findIndex(x => x.name === filename);
            this.uploadedFiles.splice(i, 1);
        }
    }

    showAmount() {

        if ( (this.newRequestForm.get('amount').value.trim() !== null) &&
             this.newRequestForm.get('amount').value.trim().includes(',')) {

            const temp = this.newRequestForm.get('amount').value.replace(',', '.');
            this.newRequestForm.get('amount').setValue(temp);
        }

        this.newRequestForm.get('amount').updateValueAndValidity();
        if ( !isNaN(this.newRequestForm.get('amount').value.trim()) ) {
            this.requestedAmount = this.newRequestForm.get('amount').value.trim();
        }

        this.showWarning = ( this.newRequestForm.get('amount').value &&
                             (+this.newRequestForm.get('amount').value > this.lowAmountLimit) &&
                             (+this.newRequestForm.get('amount').value <= this.amountLimit) &&
                             (this.requestType === 'REGULAR') );
    }

    isRegularOrServicesContract() {
        return ((this.requestType !== 'TRIP') && (this.requestType !== 'CONTRACT'));
    }

    checkIfSupplierIsRequired() {
        if ((this.newRequestForm.get('supplierSelectionMethod').value &&
            (this.newRequestForm.get('supplierSelectionMethod').value === 'AWARD_PROCEDURE')) ) {

                this.isSupplierRequired = '';
            this.newRequestForm.get('supplier').clearValidators();
        } else {
            this.isSupplierRequired = '(*)';
            this.newRequestForm.get('supplier').setValidators([Validators.required]);
        }
        this.newRequestForm.get('supplier').updateValueAndValidity();
    }

    toggleOnBehalf(event: any) {
        this.isRequestOnBehalfOfOther = event.target.checked;
        console.log(this.isRequestOnBehalfOfOther);
        if (this.isRequestOnBehalfOfOther) {
            this.newRequestForm.get('onBehalf_firstname').setValidators([Validators.required]);
            this.newRequestForm.get('onBehalf_lastname').setValidators([Validators.required]);
            this.newRequestForm.get('onBehalf_email').setValidators([Validators.required, Validators.email]);
        } else {
            this.newRequestForm.get('onBehalf_firstname').clearValidators();
            this.newRequestForm.get('onBehalf_lastname').clearValidators();
            this.newRequestForm.get('onBehalf_email').clearValidators();
        }
        this.newRequestForm.get('onBehalf_firstname').updateValueAndValidity();
        this.newRequestForm.get('onBehalf_lastname').updateValueAndValidity();
        this.newRequestForm.get('onBehalf_email').updateValueAndValidity();

    }

}
