import { TestBed } from '@angular/core/testing';

import { MediafileRepositoryService } from './mediafile-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('FileRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: MediafileRepositoryService = TestBed.get(MediafileRepositoryService);
        expect(service).toBeTruthy();
    });
});
