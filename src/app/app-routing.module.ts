import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NewRequestComponent } from './new-request/new-request.component';
import { RequestsComponent } from './requests/requests.component';
import { AboutComponent } from './about/about.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { RequestStageComponent } from './request-stage/request-stage.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ForbiddenPageComponent } from './shared/403-forbidden-page.component';
import { RequestStagePaymentComponent } from './request-stage/request-stage-payment/request-stage-payment.component';
import { CallHelpdeskPageComponent } from './error-pages/call-helpdesk-page.component';
import { NewBudgetComponent } from './new-budget/new-budget.component';
import { BudgetsComponent } from './budgets/budgets.component';
import { BudgetComponent } from './budget/budget.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'new-request/:type',
    canActivate: [AuthGuardService],
    component: NewRequestComponent
  },
  {
    path: 'requests',
    canActivate: [AuthGuardService],
    children: [
        { path: '', component: RequestsComponent },
        { path: 'request-stage/:id', component: RequestStageComponent },
        { path: 'request-stage-payment/:id', component: RequestStagePaymentComponent }
      ]
  },
  {
    path: 'new-budget',
    canActivate: [AuthGuardService],
    component: NewBudgetComponent
  },
  {
    path: 'budgets',
    canActivate: [AuthGuardService],
    children: [
        { path: '', component: BudgetsComponent },
        { path: 'budget/:id', component: BudgetComponent }
      ]
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'sign-up',
    canActivate: [AuthGuardService],
    component: SignUpComponent
  },
  {
      path: '403-forbidden',
      component: ForbiddenPageComponent
  },
  {
      path: 'login-error',
      component: CallHelpdeskPageComponent
  },
  {
    path: '**',
    redirectTo: '/home'
  }

];

@NgModule({
  imports: [ RouterModule.forRoot(appRoutes) ],
  exports: [
    RouterModule
  ],
})

export class AppRoutingModule { }
