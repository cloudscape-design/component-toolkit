// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { normalizeStartOfWeek } from '../normalize-start-of-week';

// Mock the weekstart module
jest.mock('weekstart', () => ({
  getWeekStartByLocale: jest.fn(),
}));

import { getWeekStartByLocale } from 'weekstart';

const mockGetWeekStartByLocale = getWeekStartByLocale as jest.MockedFunction<typeof getWeekStartByLocale>;

describe('normalizeStartOfWeek', () => {
  beforeEach(() => {
    mockGetWeekStartByLocale.mockReset();
  });

  describe('when startOfWeek is undefined', () => {
    test('should call getWeekStartByLocale with the provided locale', () => {
      mockGetWeekStartByLocale.mockReturnValue(0);
      const result = normalizeStartOfWeek(undefined, 'en-US');

      expect(mockGetWeekStartByLocale).toHaveBeenCalledWith('en-US');
      expect(mockGetWeekStartByLocale).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });

    test('should return Sunday (0) for US locale', () => {
      mockGetWeekStartByLocale.mockReturnValue(0);
      expect(normalizeStartOfWeek(undefined, 'en-US')).toBe(0);
    });

    test('should return Monday (1) for French locale', () => {
      mockGetWeekStartByLocale.mockReturnValue(1);
      expect(normalizeStartOfWeek(undefined, 'fr-FR')).toBe(1);
    });
  });

  test('should prioritize provided number over locale', () => {
    mockGetWeekStartByLocale.mockReturnValue(0);
    expect(normalizeStartOfWeek(1, 'en-US')).toBe(1);
    expect(mockGetWeekStartByLocale).not.toHaveBeenCalled();
  });
});
