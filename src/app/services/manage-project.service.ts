import {Injectable} from '@angular/core';
import { Project, Vocabulary } from '../domain/operation';
import {catchError} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {environment} from '../../environments/environment';
import { SearchResults } from '../domain/extraClasses';

const headerOptions = {
    headers : new HttpHeaders().set('Content-Type', 'application/json').set('Accept', 'application/json'),
    withCredentials: true
};

@Injectable()
export class ManageProjectService {

    apiUrl = environment.API_ENDPOINT + '/project/';

    constructor(private http: HttpClient) {}

    getAllProjectsNames(): Observable<Vocabulary[]> {
        const url = `${this.apiUrl}getAllProjectNames`;
        console.log(`calling ${url}`);
        return this.http.get<Vocabulary[]>(url, headerOptions);
    }

    getProjectById(projectId: string): Observable<Project> {
        const url = `${this.apiUrl}getById/${projectId}`;
        console.log(`calling ${url}`);
        return this.http.get<Project>(url, headerOptions);
    }

}
