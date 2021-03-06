import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

/**
 * Reset password component.
 *
 */
@Component({
    selector: 'os-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['../../assets/reset-password-pages.scss']
})
export class ResetPasswordComponent extends BaseComponent implements OnInit {
    /**
     * THis form holds one control for the email.
     */
    public resetPasswordForm: FormGroup;

    /**
     * Constructur for the reset password view. Initializes the form for the email.
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private http: HttpClient,
        formBuilder: FormBuilder,
        private matSnackBar: MatSnackBar,
        private router: Router
    ) {
        super(titleService, translate);
        this.resetPasswordForm = formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    /**
     * sets the title of the page
     */
    public ngOnInit(): void {
        super.setTitle('Reset password');
    }

    /**
     * Do the password reset.
     */
    public async resetPassword(): Promise<void> {
        if (this.resetPasswordForm.invalid) {
            return;
        }

        try {
            await this.http
                .post<void>(environment.urlPrefix + '/users/reset-password/', {
                    email: this.resetPasswordForm.get('email').value
                })
                .toPromise();
            // TODO: Does we get a response for displaying?
            this.matSnackBar.open(
                this.translate.instant('An email with a password reset link was send!'),
                this.translate.instant('OK'),
                {
                    duration: 0
                }
            );
            this.router.navigate(['/login']);
        } catch (e) {
            console.log('error', e);
        }
    }
}
