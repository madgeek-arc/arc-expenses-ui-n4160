import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

@Component({
    selector: 'app-call-helpdesk',
    templateUrl: './call-helpdesk-page.component.html'
})
export class CallHelpdeskPageComponent {
    constructor(private authService: AuthenticationService) {}

    loginWithOtherAccount() {
        this.authService.clearSessionAndLoginWithState();
    }

}
