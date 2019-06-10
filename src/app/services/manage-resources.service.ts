import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {Delegate, Institute, Organization, PersonOfInterest, Executive} from '../domain/operation';
import {Observable} from 'rxjs/Observable';
import { SearchResults } from '../domain/extraClasses';

const headerOptions = {
    headers : new HttpHeaders().set('Content-Type', 'application/json').set('Accept', 'application/json'),
    withCredentials: true
};


@Injectable()
export class ManageResourcesService {

    apiUrl = environment.API_ENDPOINT;

    constructor(private http: HttpClient) {}

    /* Institutes */
    getAllInstitutes(): Observable<SearchResults<Institute>> {
        const url = `${this.apiUrl}/institute/getAll`;
        console.log(`calling ${url}`);
        return this.http.get<SearchResults<Institute>>(url, headerOptions);
    }

    getInstituteNames(): Observable<Map<string, string>> {
        const url = `${this.apiUrl}/institute/getInstituteNames`;
        console.log(`calling ${url}`);
        return this.http.get<Map<string, string>>(url, headerOptions);
    }

    getInstituteById(id: string): Observable<Institute> {
        const url = `${this.apiUrl}/institute/getById/${id}`;
        console.log(`calling ${url}`);
        return this.http.get<Institute>(url, headerOptions);
    }

    addInstitute(newInstitute: Institute): Observable<Institute> {
        const url = `${this.apiUrl}/institute/add`;
        console.log(`calling ${url}`);
        return this.http.post<Institute>(url, newInstitute, headerOptions);
    }

    updateInstitute(newInstitute: Institute): Observable<Institute> {
        const url = `${this.apiUrl}/institute/update`;
        console.log(`calling ${url}`);
        return this.http.post<Institute>(url, newInstitute, headerOptions);
    }


    /* Organizations */
    getAllOrganizations(): Observable<SearchResults<Organization>> {
        const url = `${this.apiUrl}/organization/getAll`;
        console.log(`calling ${url}`);
        return this.http.get<SearchResults<Organization>>(url, headerOptions);
    }

    getOrganizationById(id: string): Observable<Organization> {
        const url = `${this.apiUrl}/organization/getById/${id}`;
        console.log(`calling ${url}`);
        return this.http.get<Organization>(url, headerOptions);
    }

    addOrganization(newOrganization: Organization): Observable<Organization> {
        const url = `${this.apiUrl}/organization/add`;
        console.log(`calling ${url}`);
        return this.http.post<Organization>(url, newOrganization, headerOptions);
    }

    updateOrganization(organization: Organization): Observable<Organization> {
        const url = `${this.apiUrl}/organization/update`;
        console.log(`calling ${url}`);
        return this.http.post<Organization>(url, organization, headerOptions);
    }

    /* Executives */
    getAllExecutives(): Observable<Executive[]> {
        const url = `${this.apiUrl}/poi/getPois`;
        console.log(`calling ${url}`);
        return this.http.get<Executive[]>(url, headerOptions);
    }

    /* POIs */
    getAllPOIs(): Observable<string[]> {
        const url = `${this.apiUrl}/poi/getAll`;
        console.log(`calling ${url}`);
        return this.http.get<string[]>(url, headerOptions);
    }

    getPOIById(id: string): Observable<PersonOfInterest> {
        const url = `${this.apiUrl}/poi/getById/${id}`;
        console.log(`calling ${url}`);
        return this.http.get<PersonOfInterest>(url, headerOptions);
    }

    addPOI(newPOI: PersonOfInterest): Observable<PersonOfInterest> {
        const url = `${this.apiUrl}/poi/add`;
        console.log(`calling ${url}`);
        return this.http.post<PersonOfInterest>(url, newPOI, headerOptions);
    }


    /* Delegates */
    getAllDelegates(): Observable<string[]> {
        const url = `${this.apiUrl}/delegate/getAll`;
        console.log(`calling ${url}`);
        return this.http.get<string[]>(url, headerOptions);
    }

    getDelegateById(id: string): Observable<Delegate> {
        const url = `${this.apiUrl}/delegate/getById/${id}`;
        console.log(`calling ${url}`);
        return this.http.get<Delegate>(url, headerOptions);
    }

    addDelegate(newDelegate: Delegate): Observable<Delegate> {
        const url = `${this.apiUrl}/delegate/add`;
        console.log(`calling ${url}`);
        return this.http.post<Delegate>(url, newDelegate, headerOptions);
    }

}
