/*
* created by myrto on 10/6/2019
* */

import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BudgetAmountsStatus, BudgetResponse, RequestSummary, YearlyBudget, YearlyBudgetSummary } from '../domain/operation';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Paging } from '../domain/extraClasses';

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
        return this.http.request(req);
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
        return this.http.request(req);
    }

    getById(budgetId: string): Observable<BudgetResponse> {
        const url = `${this.apiUrl}getById/${budgetId}`;
        console.log(`calling ${url}`);
        return this.http.get<BudgetResponse>(url, headerOptions);
    }

    getAmounts(budgetId: string): Observable<BudgetAmountsStatus> {
        const url = `${this.apiUrl}getAmounts/${budgetId}`;
        console.log(`calling ${url}`);
        return this.http.get<BudgetAmountsStatus>(url, headerOptions);
    }

    getAllBudgets(searchField: string, status: string[], stage: string[],
                  from: string, quantity: string,
                  order: string, orderField: string,
                  editable: string, isMine: string,
                  extraFilters?: Map<string, string>): Observable<Paging<YearlyBudgetSummary>> {
        let statusList = '';
        status.forEach( x => statusList = statusList + '&status=' + x.toUpperCase() );
        let stagesList = '';
        stage.forEach( x => stagesList = stagesList + '&stage=' + x );
        let url = `${this.apiUrl}getAll?from=${from}&quantity=${quantity}${statusList}${stagesList}`;
        url = url + `&order=${order}&orderField=${orderField.toUpperCase()}`;
        url = url + `&editable=${editable}&isMine=${isMine}&searchField=${searchField}`;
        if (extraFilters) {
            extraFilters.forEach(
                (val: string, k: string) => url = url + '&' + k + '=' + val
            );
        }

        console.log(`calling ${url}`);
        return this.http.get<Paging<YearlyBudgetSummary>>(url, headerOptions);
    }

}
