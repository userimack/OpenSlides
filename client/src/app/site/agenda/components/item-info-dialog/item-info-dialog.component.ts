import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { ViewItem } from '../../models/view-item';
import { itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { DurationService } from 'app/site/core/services/duration.service';

/**
 * Dialog component to change agenda item details
 */
@Component({
    selector: 'os-item-info-dialog',
    templateUrl: './item-info-dialog.component.html',
    styleUrls: ['./item-info-dialog.component.scss']
})
export class ItemInfoDialogComponent {
    /**
     * Holds the agenda item form
     */
    public agendaInfoForm: FormGroup;

    /**
     * Hold item visibility
     */
    public itemVisibility = itemVisibilityChoices;

    /**
     * Constructor
     *
     * @param formBuilder construct the form
     * @param durationService Converts numbers to readable duration strings
     * @param dialogRef the dialog reference
     * @param item the item that was selected
     */
    public constructor(
        public formBuilder: FormBuilder,
        public durationService: DurationService,
        public dialogRef: MatDialogRef<ItemInfoDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public item: ViewItem
    ) {
        this.agendaInfoForm = this.formBuilder.group({
            type: [''],
            durationText: [''],
            item_number: [''],
            comment: ['']
        });

        // load current values
        this.agendaInfoForm.get('type').setValue(item.type);
        this.agendaInfoForm.get('durationText').setValue(this.durationService.durationToString(item.duration));
        this.agendaInfoForm.get('item_number').setValue(item.itemNumber);
        this.agendaInfoForm.get('comment').setValue(item.comment);
    }

    /**
     * Function to save the item
     */
    public saveItemInfo(): void {
        this.dialogRef.close(this.agendaInfoForm.value);
    }

    /**
     * Click on cancel button
     */
    public onCancelButton(): void {
        this.dialogRef.close();
    }

    /**
     * clicking Shift and Enter will save the form
     *
     * @param event the key that was clicked
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.saveItemInfo();
        }
    }
}
