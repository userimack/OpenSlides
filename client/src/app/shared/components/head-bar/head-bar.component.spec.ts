import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadBarComponent } from './head-bar.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('HeadBarComponent', () => {
    let component: HeadBarComponent;
    let fixture: ComponentFixture<HeadBarComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HeadBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
