import { TestBed } from '@angular/core/testing';

import { ReceiveTagsService } from './receive-tags.service';

describe('ReceiveTagsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ReceiveTagsService = TestBed.get(ReceiveTagsService);
    expect(service).toBeTruthy();
  });
});
