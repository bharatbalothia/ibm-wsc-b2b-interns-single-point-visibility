import { TestBed } from '@angular/core/testing';

import { FileDetailsService } from './file-details.service';

describe('FileDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FileDetailsService = TestBed.get(FileDetailsService);
    expect(service).toBeTruthy();
  });
});
