import { Injectable } from '@angular/core';
import { OpenSlidesComponent } from '../../openslides.component';
import { MatDialog } from '@angular/material';
import {
    ChoiceDialogComponent,
    ChoiceDialogOptions,
    ChoiceAnswer
} from '../../shared/components/choice-dialog/choice-dialog.component';

/**
 * A service for prompting the user to select a choice.
 */
@Injectable({
    providedIn: 'root'
})
export class ChoiceService extends OpenSlidesComponent {
    /**
     * Ctor.
     *
     * @param dialog For opening the ChoiceDialog
     */
    public constructor(private dialog: MatDialog) {
        super();
    }

    /**
     * Opens the dialog. Returns the chosen value after the user accepts.
     * @param title The title to display in the dialog
     * @param choices The available choices
     * @param multiSelect turn on the option to select multiple entries.
     *  The answer.items will then be an array.
     * @param actions optional strings for buttons replacing the regular confirmation.
     * The answer.action will reflect the button selected
     * @param clearChoice A string for an extra, visually slightly separated
     * choice for 'explicitly set an empty selection'. The answer's action may
     * have this string's value
     * @returns an answer {@link ChoiceAnswer}
     */
    public async open(
        title: string,
        choices: ChoiceDialogOptions,
        multiSelect: boolean = false,
        actions?: string[],
        clearChoice?: string
    ): Promise<ChoiceAnswer> {
        const dialogRef = this.dialog.open(ChoiceDialogComponent, {
            minWidth: '250px',
            maxHeight: '90vh',
            data: {
                title: title,
                choices: choices,
                multiSelect: multiSelect,
                actionButtons: actions,
                clearChoice: clearChoice
            }
        });
        return dialogRef.afterClosed().toPromise();
    }
}
