import { Component, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app';

  constructor(private router: Router,
              private authService: AuthenticationService) {

    // TODO: DON'T FORGET TO UPDATE BEFORE COMMIT!!!
    console.log('committed on: 05-06-2019 13:20 pm');

    // hides the console logs in production
    if ( (environment.production === true) &&
         !window.location.origin.includes('aleka') &&
         !window.location.origin.includes('beta')) {
        window.console.log = function () {};
    }

      this.authService.tryLogin();
  }

  ngOnInit() {
      if (isDevMode()) {
          console.log('In development mode!');
      } else {
          console.log('In production mode!');
      }
      this.router.events.subscribe((evt) => {
          if (!(evt instanceof NavigationEnd)) {
              return;
          }
          window.scrollTo(0, 0);
      });

  }

  ngOnDestroy() {
      console.log('logging out from appComponent onDestroy');
      this.authService.logout();
  }

  showTop() {
    return this.router.url !== '/sign-up';
  }
}
