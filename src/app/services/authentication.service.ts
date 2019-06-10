import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { deleteCookie, getCookie } from '../domain/cookieUtils';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { environment } from '../../environments/environment';

const headerOptions = {
    headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json'),
    withCredentials: true
};

@Injectable()
export class AuthenticationService {

    constructor(private router: Router,
                private http: HttpClient) { }

    private apiUrl: string = environment.API_ENDPOINT;
    private loginUrl: string = environment.API_ENDPOINT + '/user/idp_login?returnTo=' + window.location.origin;

    // store the URL so we can redirect after logging in
    public redirectUrl: string;

    private _storage: Storage = sessionStorage;

    isLoggedIn = false;

    public loginWithState() {
        if ( (sessionStorage.getItem('state.location') == null) ) {
            console.log(`logging in with state. Current url is: ${this.router.url}`);
            sessionStorage.setItem('state.location', this.router.url );
        }
        console.log(`logging in. Current state.location is: ${this.router.url}`);
        console.log(`going to ${this.loginUrl}`);
        window.location.href = this.loginUrl;
    }

    clearSessionAndLoginWithState() {
        let state: string;
        if (sessionStorage.getItem('state.location')) {
            state = sessionStorage.getItem('state.location');
        }
        deleteCookie('arc_currentUser');
        this.isLoggedIn = false;
        this.removeUserProperties();
        console.log('trying to login again');
        if (state) {
            sessionStorage.setItem('state.location', state);
        }
        this.loginWithState();
    }

    public logout() {
        deleteCookie('arc_currentUser');
        this.isLoggedIn = false;
        this.removeUserProperties();

        console.log('logging out');
        /*console.log(`${this.baseUrl}Shibboleth.sso/Logout?return=${window.location.origin}`);
        window.location.href = `${this.baseUrl}Shibboleth.sso/Logout?return=${window.location.origin}`;*/

        /*console.log(`${this.baseUrl}Shibboleth.sso/Logout?return=${window.location.origin}/arc-expenses-service/logout`);
        window.location.href = `${this.baseUrl}Shibboleth.sso/Logout?return=${window.location.origin}/arc-expenses-service/logout`;*/

        console.log(`${this.apiUrl}/logout`);
        window.location.href = `${this.apiUrl}/logout`;

    }

    public tryLogin() {
        console.log('entering tryLogin -> state.location is:', sessionStorage.getItem('state.location'));
        console.log('cookie is:', JSON.stringify(getCookie('arc_currentUser')));
        if (getCookie('arc_currentUser') && (getCookie('arc_currentUser') !== '')) {

            console.log(`I got the cookie!`);

            /* SETTING INTERVAL TO REFRESH SESSION TIMEOUT COUNTER */
            setInterval(() => {
                this.http.get(this.apiUrl + '/user/getUserInfo', headerOptions).subscribe(
                    userInfo => {
                        console.log('User is still logged in');
                        console.log(userInfo);
                        if ( (sessionStorage.getItem('userInfo') == null) ||
                             (this.getUserProp('email') === null ) ) {
                            console.log('cant find userInfo in sessionStorage - logging out');
                            this.logout();
                        }
                    },
                    () => {
                        console.log(`Something went wrong -- I'm logging out!`);
                        this.logout();
                    }
                );
            }, 1000 * 60 * 5);

            if ( !sessionStorage.getItem('userInfo') ) {
                console.log(`session.userInfo wasn't found --> logging in via arc-service!`);
                this.http.get(this.apiUrl + '/user/getUserInfo', headerOptions).subscribe(
                    userInfo => {
                        console.log(JSON.stringify(userInfo));
                        if ( userInfo ) {
                            this.isLoggedIn = true;
                            // TODO: KEEP UNTIL KKARAMAL GETS A REAL ROLE_EXECUTIVE!!
                            if (userInfo['user'] && userInfo['user']['email'] &&
                                (userInfo['user']['email'] === 'kkaramal@ipet.athena-innovation.gr')) {
                                sessionStorage.setItem('role', '[{"authority":"ROLE_EXECUTIVE"}]');
                            } else {
                                sessionStorage.setItem('role', JSON.stringify(userInfo['role']));
                                // sessionStorage.setItem('role', '[{"authority":"ROLE_ADMIN"}]');
                            }
                            this.setUserProperties(userInfo['user']);
                        }
                    },
                    error => {
                        console.log('login error or coming back after closing the browser!');
                        console.log(error);
                        this.loginWithState();
                    },
                    () => {
                        if ( sessionStorage.getItem('userInfo') ) {
                            console.log(`the current user is: ${this.getUserProp('firstname')}, ` +
                                                             `${this.getUserProp('lastname')}, ` +
                                                             `${this.getUserProp('email')}`);

                            if ( (this.getUserProp('email') == null) ) {
                                this.logout();
                            } else if ( (this.getUserProp('firstname') === null) ||
                                        (this.getUserProp('lastname') === null) ) {

                                console.log('in tryLogin navigating to sign-up');
                                this.router.navigate(['/sign-up']);

                            } else {
                                let state: string;
                                if ( sessionStorage.getItem('state.location') ) {
                                    state = sessionStorage.getItem('state.location');
                                    sessionStorage.removeItem('state.location');
                                    console.log(`cleared state.location - returning to state: ${state}`);
                                    this.router.navigateByUrl(state);
                                }
                            }
                        }
                    }
                );
            }
        }

    }

    public getIsUserLoggedIn() {
        return (getCookie('arc_currentUser') && (getCookie('arc_currentUser') !== '') &&
                sessionStorage.getItem('userInfo') && (sessionStorage.getItem('userInfo') !== ''));
    }

    public getUserRole() {
        if ( this.getIsUserLoggedIn() &&
             sessionStorage.getItem('role') &&
             (sessionStorage.getItem('role') !== 'null') ) {

            return JSON.parse(sessionStorage.getItem('role'));
        } else {
            return [];
        }
    }

    getUserProp(property: string) {
        if (sessionStorage.getItem('userInfo')) {
            const user = JSON.parse(sessionStorage.getItem('userInfo'));
            if ( (user[property] != null) && (user[property] !== '') && (user[property] !== 'null') ) {

                if ( (property === 'immediateEmails') || (property === 'receiveEmails') ) {
                    return (user[property] === 'true');
                }
                return user[property];
            }
        }
        return null;
    }

    setUserProperties (userInfo: any) {
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    }

    removeUserProperties () {
        sessionStorage.clear();
    }

    updateUserInfo(firstname: string, lastname: string, receiveEmails: string, immediateEmails: string) {

        const url = `${this.apiUrl}/user/update`;
        console.log(`calling ${url}`);

        const updatedUser = {
            email: this.getUserProp('email'),
            firstname: firstname,
            firstnameLatin: this.getUserProp('firstnameLatin'),
            id: this.getUserProp('id'),
            lastname: lastname,
            lastnameLatin: this.getUserProp('lastnameLatin'),
            receiveEmails: receiveEmails,
            immediateEmails: immediateEmails
        };

        console.log(`sending: ${JSON.stringify(updatedUser)}`);

        return this.http.post(url, updatedUser, headerOptions).pipe(
            tap(userInfo => {
                if (userInfo) {
                    this.setUserProperties(userInfo);
                }
            }),
            catchError(this.handleError)
        );
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
