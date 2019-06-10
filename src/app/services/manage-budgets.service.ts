/*
* created by myrto on 10/6/2019
* */

import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { YearlyBudget } from '../domain/operation';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

const headerOptions = {
    headers : new HttpHeaders().set('Content-Type', 'application/json').set('Accept', 'application/json'),
    withCredentials: true
};

@Injectable()
export class ManageBudgetsService {

    apiUrl = environment.API_ENDPOINT + '/budget/';


    constructor(private http: HttpClient) {}


    add<T>(newBudget: FormData): Observable<HttpEvent<T>> {
        const url = `${this.apiUrl}add`;
        console.log(`calling ${url}`);

        const req = new HttpRequest('POST', url, newBudget, {
            reportProgress: true,
            withCredentials: true
        });
        return this.http.request(req).pipe(catchError(this.handleError));
    }

    submitUpdate<T>(mode: string, budgetId: string, submittedStage?: FormData): Observable<HttpEvent<T>> {
        /* ACCEPTED MODE VALUES: approve, reject, downgrade, cancel */
        const url = `${this.apiUrl}${mode}/${budgetId}`;
        console.log(`calling ${url}`);

        let formData = new FormData();
        if (submittedStage) { formData = submittedStage; }

        const req = new HttpRequest('POST', url, formData, {
            reportProgress: true,
            withCredentials: true
        });
        return this.http.request(req).pipe(catchError(this.handleError));
    }

    getById(budgetId: string): Observable<YearlyBudget> {
        const url = `${this.apiUrl}getById`;
        console.log(`calling ${url}`);
        return this.http.get<YearlyBudget>(url, headerOptions);
    }


    /*handleError function as provided by angular.io (copied on 27/4/2018)*/
    private handleError(error: HttpErrorResponse) {
        console.log(error);
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
        }
        // return an ErrorObservable with a user-facing error message
        return new ErrorObservable(
            'Something bad happened; please try again later.');
    }
}
