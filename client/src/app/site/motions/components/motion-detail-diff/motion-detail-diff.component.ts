import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { LineNumberingMode, ViewMotion } from '../../models/view-motion';
import { ViewUnifiedChange, ViewUnifiedChangeType } from '../../models/view-unified-change';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { LineRange, ModificationType } from '../../services/diff.service';
import { ViewChangeReco } from '../../models/view-change-reco';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ChangeRecommendationRepositoryService } from '../../services/change-recommendation-repository.service';
import {
    MotionChangeRecommendationComponent,
    MotionChangeRecommendationComponentData
} from '../motion-change-recommendation/motion-change-recommendation.component';
import { BaseViewComponent } from '../../../base/base-view';
import { TranslateService } from '@ngx-translate/core';

/**
 * This component displays the original motion text with the change blocks inside.
 * If the user is an administrator, each change block can be rejected.
 *
 * The line numbers are provided within the pre-rendered HTML, so we have to work with raw HTML and native HTML elements.
 *
 * It takes the styling from the parent component.
 *
 * ## Examples
 *
 * ```html
 *  <os-motion-detail-diff
 *       [motion]="motion"
 *       [changes]="changes"
 *       [scrollToChange]="change"
 *       (createChangeRecommendation)="createChangeRecommendation($event)"
 * ></os-motion-detail-diff>
 * ```
 */
@Component({
    selector: 'os-motion-detail-diff',
    templateUrl: './motion-detail-diff.component.html',
    styleUrls: ['./motion-detail-diff.component.scss']
})
export class MotionDetailDiffComponent extends BaseViewComponent implements AfterViewInit {
    @Input()
    public motion: ViewMotion;
    @Input()
    public changes: ViewUnifiedChange[];
    @Input()
    public scrollToChange: ViewUnifiedChange;

    @Output()
    public createChangeRecommendation: EventEmitter<LineRange> = new EventEmitter<LineRange>();

    /**
     * @param title
     * @param translate
     * @param matSnackBar
     * @param sanitizer
     * @param motionRepo
     * @param recoRepo
     * @param dialogService
     * @param el
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private sanitizer: DomSanitizer,
        private motionRepo: MotionRepositoryService,
        private recoRepo: ChangeRecommendationRepositoryService,
        private dialogService: MatDialog,
        private el: ElementRef
    ) {
        super(title, translate, matSnackBar);
    }

    /**
     * Returns the part of this motion between two change objects
     * @param {ViewUnifiedChange} change1
     * @param {ViewUnifiedChange} change2
     */
    public getTextBetweenChanges(change1: ViewUnifiedChange, change2: ViewUnifiedChange): string {
        // @TODO Highlighting
        const lineRange: LineRange = {
            from: change1 ? change1.getLineTo() : 1,
            to: change2 ? change2.getLineFrom() : null
        };

        if (lineRange.from >= lineRange.to) {
            // Empty space between two amendments, or between colliding amendments
            return '';
        }

        return this.motionRepo.extractMotionLineRange(this.motion.id, lineRange, true);
    }

    /**
     * Returns true if this change is colliding with another change
     * @param {ViewUnifiedChange} change
     * @param {ViewUnifiedChange[]} changes
     */
    public hasCollissions(change: ViewUnifiedChange, changes: ViewUnifiedChange[]): boolean {
        return (
            changes.filter((otherChange: ViewUnifiedChange) => {
                return (
                    otherChange.getChangeId() !== change.getChangeId() &&
                    ((otherChange.getLineFrom() >= change.getLineFrom() &&
                        otherChange.getLineFrom() < change.getLineTo()) ||
                        (otherChange.getLineTo() > change.getLineFrom() &&
                            otherChange.getLineTo() <= change.getLineTo()) ||
                        (otherChange.getLineFrom() < change.getLineFrom() &&
                            otherChange.getLineTo() > change.getLineTo()))
                );
            }).length > 0
        );
    }

    /**
     * Returns the diff string from the motion to the change
     * @param {ViewUnifiedChange} change
     */
    public getDiff(change: ViewUnifiedChange): SafeHtml {
        const html = this.motionRepo.getChangeDiff(this.motion, change);
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    /**
     * Returns the remainder text of the motion after the last change
     */
    public getTextRemainderAfterLastChange(): string {
        return this.motionRepo.getTextRemainderAfterLastChange(this.motion, this.changes);
    }

    /**
     * Returns true if the change is a Change Recommendation
     *
     * @param {ViewUnifiedChange} change
     */
    public isRecommendation(change: ViewUnifiedChange): boolean {
        return change.getChangeType() === ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION;
    }

    /**
     * Returns true if no line numbers are to be shown.
     *
     * @returns whether there are line numbers at all
     */
    public isLineNumberingNone(): boolean {
        return this.motion.lnMode === LineNumberingMode.None;
    }

    /**
     * Returns true if the line numbers are to be shown within the text with no line breaks.
     *
     * @returns whether the line numberings are inside
     */
    public isLineNumberingInline(): boolean {
        return this.motion.lnMode === LineNumberingMode.Inside;
    }

    /**
     * Returns true if the line numbers are to be shown to the left of the text.
     *
     * @returns whether the line numberings are outside
     */
    public isLineNumberingOutside(): boolean {
        return this.motion.lnMode === LineNumberingMode.Outside;
    }

    /**
     * Returns accepted, rejected or an empty string depending on the state of this change.
     *
     * @param change
     */
    public getAcceptanceValue(change: ViewUnifiedChange): string {
        if (change.isAccepted()) {
            return 'accepted';
        }
        if (change.isRejected()) {
            return 'rejected';
        }
        return '';
    }

    /**
     * Returns true if the change is an Amendment
     *
     * @param {ViewUnifiedChange} change
     */
    public isAmendment(change: ViewUnifiedChange): boolean {
        return change.getChangeType() === ViewUnifiedChangeType.TYPE_AMENDMENT;
    }

    /**
     * Returns true if the change is a Change Recommendation
     *
     * @param {ViewUnifiedChange} change
     */
    public isChangeRecommendation(change: ViewUnifiedChange): boolean {
        return change.getChangeType() === ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION;
    }

    /**
     * Gets the name of the modification type
     *
     * @param change
     */
    public getRecommendationTypeName(change: ViewChangeReco): string {
        switch (change.type) {
            case ModificationType.TYPE_REPLACEMENT:
                return 'Replacement';
            case ModificationType.TYPE_INSERTION:
                return 'Insertion';
            case ModificationType.TYPE_DELETION:
                return 'Deletion';
            default:
                return '@UNKNOWN@';
        }
    }

    /**
     * Sets a change recommendation to accepted or rejected.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewChangeReco} change
     * @param {string} value
     */
    public async setAcceptanceValue(change: ViewChangeReco, value: string): Promise<void> {
        try {
            if (value === 'accepted') {
                await this.recoRepo.setAccepted(change);
            }
            if (value === 'rejected') {
                await this.recoRepo.setRejected(change);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Sets if a change recommendation is internal or not
     *
     * @param {ViewChangeReco} change
     * @param {boolean} internal
     */
    public setInternal(change: ViewChangeReco, internal: boolean): void {
        this.recoRepo.setInternal(change, internal).then(null, this.raiseError);
    }

    /**
     * Deletes a change recommendation.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewChangeReco} reco
     * @param {MouseEvent} $event
     */
    public deleteChangeRecommendation(reco: ViewChangeReco, $event: MouseEvent): void {
        $event.stopPropagation();
        $event.preventDefault();
        this.recoRepo.delete(reco).then(null, this.raiseError);
    }

    /**
     * Edits a change recommendation.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewChangeReco} reco
     * @param {MouseEvent} $event
     */
    public editChangeRecommendation(reco: ViewChangeReco, $event: MouseEvent): void {
        $event.stopPropagation();
        $event.preventDefault();

        const data: MotionChangeRecommendationComponentData = {
            editChangeRecommendation: true,
            newChangeRecommendation: false,
            lineRange: {
                from: reco.getLineFrom(),
                to: reco.getLineTo()
            },
            changeRecommendation: reco
        };
        this.dialogService.open(MotionChangeRecommendationComponent, {
            height: '400px',
            width: '600px',
            data: data
        });
    }

    /**
     * Scrolls to the native element specified by [scrollToChange]
     */
    private scrollToChangeElement(change: ViewUnifiedChange): void {
        const element = <HTMLElement>this.el.nativeElement;
        const target = element.querySelector('[data-change-id="' + change.getChangeId() + '"]');
        target.scrollIntoView({ behavior: 'smooth' });
    }

    public scrollToChangeClicked(change: ViewUnifiedChange, $event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.scrollToChangeElement(change);
    }

    /**
     * Called from motion-detail-original-change-recommendations -> delegate to parent
     *
     * @param {LineRange} event
     */
    public onCreateChangeRecommendation(event: LineRange): void {
        this.createChangeRecommendation.emit(event);
    }

    public ngAfterViewInit(): void {
        if (this.scrollToChange) {
            window.setTimeout(() => {
                this.scrollToChangeElement(this.scrollToChange);
            }, 50);
        }
    }
}
