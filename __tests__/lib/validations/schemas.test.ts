/**
 * Tests for Zod validation schemas
 */

import {
  analysisRunSchema,
  alertCreateSchema,
  brandSchema,
  domainSchema,
  urlSchema,
  validateBody,
} from '@/lib/validations/schemas';
import { VALIDATION, ALERT_TYPE } from '@/lib/constants';

describe('Validation Schemas', () => {
  describe('brandSchema', () => {
    it('should accept valid brand names', () => {
      const validBrands = ['Nike', 'Coca-Cola', 'Apple Inc.', 'Test Brand 123'];

      validBrands.forEach((brand) => {
        const result = brandSchema.safeParse(brand);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty brand names', () => {
      const result = brandSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject brand names exceeding max length', () => {
      const longBrand = 'a'.repeat(VALIDATION.MAX_BRAND_LENGTH + 1);
      const result = brandSchema.safeParse(longBrand);
      expect(result.success).toBe(false);
    });

    it('should reject brand names with newlines', () => {
      const result = brandSchema.safeParse('Brand\nName');
      expect(result.success).toBe(false);
    });
  });

  describe('domainSchema', () => {
    it('should accept valid domains', () => {
      const validDomains = ['example.com', 'sub.example.com', 'my-site.co.uk'];

      validDomains.forEach((domain) => {
        const result = domainSchema.safeParse(domain);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid domains', () => {
      const invalidDomains = ['', 'not a domain', 'http://example.com', '.com'];

      invalidDomains.forEach((domain) => {
        const result = domainSchema.safeParse(domain);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('urlSchema', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.com/path',
        'https://sub.domain.com/path?query=value',
      ];

      validUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = ['not-a-url', 'example.com', 'ftp://invalid'];

      invalidUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('analysisRunSchema', () => {
    it('should accept valid analysis input', () => {
      const validInput = {
        brandOrKeyword: 'Nike',
        domain: 'nike.com',
        competitors: ['Adidas', 'Puma'],
        category: 'Sports',
      };

      const result = analysisRunSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.brandOrKeyword).toBe('Nike');
        expect(result.data.competitors).toEqual(['Adidas', 'Puma']);
      }
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        brandOrKeyword: 'TestBrand',
      };

      const result = analysisRunSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competitors).toEqual([]);
      }
    });

    it('should parse comma-separated competitors string', () => {
      const input = {
        brandOrKeyword: 'Nike',
        competitors: 'Adidas, Puma, Reebok',
      };

      const result = analysisRunSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competitors).toEqual(['Adidas', 'Puma', 'Reebok']);
      }
    });

    it('should limit competitors to max allowed', () => {
      const input = {
        brandOrKeyword: 'Nike',
        competitors: Array(20).fill('Competitor'),
      };

      const result = analysisRunSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competitors.length).toBe(VALIDATION.MAX_COMPETITORS);
      }
    });

    it('should reject missing brand', () => {
      const result = analysisRunSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('alertCreateSchema', () => {
    it('should accept valid alert input', () => {
      const validAlert = {
        name: 'Visibility Alert',
        type: ALERT_TYPE.VISIBILITY_DROP,
        conditions: [
          { field: 'score', operator: 'less_than', value: 50 },
        ],
        channels: [
          { type: 'email', target: 'user@example.com' },
        ],
      };

      const result = alertCreateSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it('should reject invalid alert type', () => {
      const invalidAlert = {
        name: 'Test Alert',
        type: 'invalid_type',
      };

      const result = alertCreateSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalAlert = {
        name: 'Test Alert',
        type: ALERT_TYPE.VISIBILITY_DROP,
      };

      const result = alertCreateSchema.safeParse(minimalAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('demo-user');
        expect(result.data.enabled).toBe(true);
        expect(result.data.throttleEnabled).toBe(false);
        expect(result.data.conditions).toEqual([]);
        expect(result.data.channels).toEqual([]);
      }
    });

    it('should reject missing name', () => {
      const result = alertCreateSchema.safeParse({
        type: ALERT_TYPE.VISIBILITY_DROP,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateBody utility', () => {
    it('should return validated data for valid input', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ brandOrKeyword: 'TestBrand' }),
      } as unknown as Request;

      const [data, error] = await validateBody(mockRequest, analysisRunSchema);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.brandOrKeyword).toBe('TestBrand');
    });

    it('should return error for invalid JSON', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request;

      const [data, error] = await validateBody(mockRequest, analysisRunSchema);

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.error).toBe('Invalid JSON body');
    });

    it('should return validation errors for invalid data', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Request;

      const [data, error] = await validateBody(mockRequest, analysisRunSchema);

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.error).toBe('Validation failed');
      expect(error?.details).toBeDefined();
    });
  });
});
