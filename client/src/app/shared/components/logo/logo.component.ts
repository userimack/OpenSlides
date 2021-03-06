import { Component, OnInit, Input } from '@angular/core';
import { MediaManageService } from '../../../site/mediafiles/services/media-manage.service';

/**
 * Reusable Logo component for Apps.
 *
 * Following actions are possible:
 * * "logo_projector_main"
 * * "logo_projector_header"
 * * "logo_web_header"
 * * "logo_pdf_header_L"
 * * "logo_pdf_header_R"
 * * "logo_pdf_footer_L"
 * * "logo_pdf_footer_R"
 * * "logo_pdf_ballot_paper"
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-logo
 *   inputAction="logo_projector_main"
 *   [footer]="false"
 *   [alignment]="right">
 * </os-logo>
 * ```
 *
 * Sidenote: The footer variable is optional. Only if you want
 * alternating logos, i.E. in the sidenav. the Alignment is also
 * optional.
 */
@Component({
    selector: 'os-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit {
    /**
     * Constant path of the dark logo
     */
    public static STANDARD_LOGO = '/assets/img/openslides-logo-h.svg';

    /**
     * Holds the actions for logos. Updated via an observable
     */
    public logoActions: string[];

    /**
     * decides based on the actionString how to display the logo
     */
    @Input()
    public inputAction: string;

    /**
     * determines if the current picture is displayed in the footer.
     * Optional.
     */
    @Input()
    public footer = false;

    /**
     * influences text-alignment in the .logo-container css class
     */
    @Input()
    public alignment = 'center';
    /**
     * The consotructor
     *
     * @param mmservice The Media Manage Service
     */
    public constructor(private mmservice: MediaManageService) {}

    /**
     * Initialization function
     */
    public ngOnInit(): void {
        this.mmservice.getLogoActions().subscribe(action => {
            this.logoActions = action;
        });
    }

    /**
     * gets the image based on the inputAction and location.
     * Possible inputActions are in the class description.
     *
     * @returns path to image
     */
    public getImage(): string {
        if (this.footer) {
            const path = this.getFooterImage(this.inputAction);
            return path;
        } else {
            const path = this.getHeaderImage(this.inputAction, this.alignment);
            return path;
        }
    }

    /**
     * gets the header image based on logo action
     *
     * @param logoAction the logo action to be used
     * @param alignment the alignment of the logo (optional)
     * @returns path to image
     */
    protected getHeaderImage(logoAction: string, alignment: string = 'center'): string {
        if (alignment !== 'center') {
            this.setAlignment(alignment);
        }
        let path = '';
        /* check if datastore is loaded and custom logo can be read */
        if (this.logoActions === undefined) {
            return '';
        }
        if (this.mmservice !== undefined) {
            if (this.mmservice.isImageConfigObject(this.mmservice.getMediaConfig(logoAction))) {
                const imageConfig = this.mmservice.getMediaConfig(logoAction);
                path = imageConfig.path;
            }
        }
        if (path === '') {
            path = LogoComponent.STANDARD_LOGO;
        }
        return path;
    }

    /**
     * Changes the alignment from center to either 'left' or 'right'
     *
     * @param alignment either 'right' or 'left'
     */
    private setAlignment(alignment: string): void {
        if (alignment === 'left' || alignment === 'right') {
            const cssLogoContainer = document.getElementsByClassName('logo-container') as HTMLCollectionOf<HTMLElement>;
            if (cssLogoContainer.length !== 0) {
                cssLogoContainer[0].style.textAlign = alignment;
            }
        }
    }

    /**
     * Returns the image-path for the footer
     *
     * @param logoAction the logo action to be used
     * @returns '' if no logo is set and path to standard logo if a custom
     *  logo was set
     */
    protected getFooterImage(logoAction: string): string {
        if (this.getHeaderImage(logoAction) === LogoComponent.STANDARD_LOGO || this.getHeaderImage(logoAction) === '') {
            return '';
        } else {
            return LogoComponent.STANDARD_LOGO;
        }
    }
}
