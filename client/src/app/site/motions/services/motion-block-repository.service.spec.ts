import { TestBed } from '@angular/core/testing';

import { MotionBlockRepositoryService } from './motion-block-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionBlockRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionBlockRepositoryService = TestBed.get(MotionBlockRepositoryService);
        expect(service).toBeTruthy();
    });
});
