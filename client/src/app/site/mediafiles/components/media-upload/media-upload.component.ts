import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatTableDataSource, MatTable, MatSnackBar } from '@angular/material';

import { UploadEvent, FileSystemFileEntry } from 'ngx-file-drop';
import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { OperatorService } from 'app/core/services/operator.service';
import { MediafileRepositoryService } from '../../services/mediafile-repository.service';

/**
 * To hold the structure of files to upload
 */
interface FileData {
    mediafile: File;
    filename: string;
    title: string;
    uploader_id: number;
    hidden: boolean;
}

/**
 * Handle file uploads from user
 */
@Component({
    selector: 'os-media-upload',
    templateUrl: './media-upload.component.html',
    styleUrls: ['./media-upload.component.scss']
})
export class MediaUploadComponent extends BaseViewComponent implements OnInit {
    /**
     * Columns to display in the upload-table
     */
    public displayedColumns: string[] = ['title', 'filename', 'information', 'hidden', 'remove'];

    /**
     * Determine wheter to show the progress bar
     */
    public showProgress = false;

    /**
     * Consumable data source for the table
     */
    public uploadList: MatTableDataSource<FileData>;

    /**
     * To count the files that report successful uploading
     */
    public filesUploaded: number;

    /**
     * Determine if uploading should happen parallel or synchronously.
     * Synchronous uploading might be necessary if we see that stuff breaks
     */
    public parallel = true;

    /**
     * Set to true if an error was detected to prevent automatic navigation
     */
    public error = false;

    /**
     * Hold the mat table to manually render new rows
     */
    @ViewChild(MatTable)
    public table: MatTable<any>;

    /**
     * Constructor for the media upload page
     *
     * @param titleService set the browser title
     * @param translate the translation service
     * @param matSnackBar showing errors and information
     * @param router Angulars own router
     * @param route Angulars activated route
     * @param repo the mediafile repository
     * @param op the operator, to check who was the uploader
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private repo: MediafileRepositoryService,
        private op: OperatorService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init
     * Creates a new uploadList as consumable data source
     */
    public ngOnInit(): void {
        this.uploadList = new MatTableDataSource<FileData>();
    }

    /**
     * Converts given FileData into FormData format and hands it over to the repository
     * to upload
     *
     * @param fileData the file to upload to the server, should fit to the FileData interface
     */
    public async uploadFile(fileData: FileData): Promise<void> {
        const input = new FormData();
        input.set('mediafile', fileData.mediafile);
        input.set('title', fileData.title);
        input.set('uploader_id', '' + fileData.uploader_id);
        input.set('hidden', '' + fileData.hidden);

        // raiseError will automatically ignore existing files
        await this.repo.uploadFile(input).then(
            () => {
                this.filesUploaded++;
                // remove the uploaded file from the array
                this.onRemoveButton(fileData);
            },
            error => {
                this.error = true;
                this.raiseError(`${error} :"${fileData.title}"`);
            }
        );
    }

    /**
     * Converts a file size in bit into human readable format
     *
     * @param bits file size in bits
     * @returns a readable file size representation
     */
    public getReadableSize(bits: number): string {
        const unitLevel = Math.floor(Math.log(bits) / Math.log(1024));
        const bytes = +(bits / Math.pow(1024, unitLevel)).toFixed(2);
        return `${bytes} ${['B', 'kB', 'MB', 'GB', 'TB'][unitLevel]}`;
    }

    /**
     * Change event to set a file to hidden or not
     *
     * @param hidden whether the file should be hidden
     * @param file the given file
     */
    public onChangeHidden(hidden: boolean, file: FileData): void {
        file.hidden = hidden;
    }

    /**
     * Change event to adjust the title
     *
     * @param newTitle the new title
     * @param file the given file
     */
    public onChangeTitle(newTitle: string, file: FileData): void {
        file.title = newTitle;
    }

    /**
     * Add a file to list to upload later
     *
     * @param file the file to upload
     */
    public addFile(file: File): void {
        const newFile: FileData = {
            mediafile: file,
            filename: file.name,
            title: file.name,
            uploader_id: this.op.user.id,
            hidden: false
        };
        this.uploadList.data.push(newFile);

        if (this.table) {
            this.table.renderRows();
        }
    }

    /**
     * Handler for the select file event
     *
     * @param $event holds the file. Triggered by changing the file input element
     */
    public onSelectFile(event: any): void {
        if (event.target.files && event.target.files.length > 0) {
            // file list is a special kind of collection, so array.foreach does not apply
            for (const addedFile of event.target.files) {
                this.addFile(addedFile);
            }
        }
    }

    /**
     * Handler for the drop-file event
     *
     * @param event holds the file. Triggered by dropping in the area
     */
    public onDropFile(event: UploadEvent): void {
        for (const droppedFile of event.files) {
            // Check if the dropped element is a file. "Else" would be a dir.
            if (droppedFile.fileEntry.isFile) {
                const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
                fileEntry.file((file: File) => {
                    this.addFile(file);
                });
            }
        }
    }

    /**
     * Click handler for the upload button.
     * Iterate over the upload list and executes `uploadFile` on each element
     */
    public async onUploadButton(): Promise<void> {
        if (this.uploadList && this.uploadList.data.length > 0) {
            this.filesUploaded = 0;
            this.error = false;
            this.showProgress = true;

            if (this.parallel) {
                const promises = this.uploadList.data.map(file => this.uploadFile(file));
                await Promise.all(promises);
            } else {
                for (const file of this.uploadList.data) {
                    await this.uploadFile(file);
                }
            }
            this.showProgress = false;

            if (!this.error) {
                this.router.navigate(['../'], { relativeTo: this.route });
            } else {
                this.table.renderRows();
            }
        }
    }

    /**
     * Calculate the progress to display in the progress bar
     * Only used in synchronous upload since parallel upload
     *
     * @returns the upload progress in percent.
     */
    public calcUploadProgress(): number {
        if (this.filesUploaded && this.uploadList.data) {
            return 100 / (this.uploadList.data.length / this.filesUploaded);
        } else {
            return 0;
        }
    }

    /**
     * Removes the given file from the upload table
     *
     * @param file the file to remove
     */
    public onRemoveButton(file: FileData): void {
        if (this.uploadList.data) {
            this.uploadList.data.splice(this.uploadList.data.indexOf(file), 1);
            this.table.renderRows();
        }
    }

    /**
     * Click handler for the clear button. Deletes the upload list
     */
    public onClearButton(): void {
        this.uploadList.data = [];
        if (this.table) {
            this.table.renderRows();
        }
    }

    /**
     * Changes the upload strategy between synchronous and parallel
     *
     * @param isParallel true or false, whether parallel upload is required or not
     */
    public setUploadStrategy(isParallel: boolean): void {
        this.parallel = isParallel;
    }
}
