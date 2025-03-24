import * as arrayUtils from '../../utils/array';
import * as stringUtils from '../../utils/string';
import * as objectUtils from '../../utils/object';
import * as dateUtils from '../../utils/date';
import * as mathUtils from '../../utils/math';
import { ValidationError } from '../../errors/validation-error';
import { DateRangePreset, TimeInterval } from '../../types/common.types';

describe('Array Utilities', () => {
  describe('isEmpty', () => {
    it('should return true for null or undefined arrays', () => {
      expect(arrayUtils.isEmpty(null)).toBe(true);
      expect(arrayUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(arrayUtils.isEmpty([])).toBe(true);
    });

    it('should return false for non-empty arrays', () => {
      expect(arrayUtils.isEmpty([1, 2, 3])).toBe(false);
      expect(arrayUtils.isEmpty(['a'])).toBe(false);
      expect(arrayUtils.isEmpty([null])).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return false for null or undefined arrays', () => {
      expect(arrayUtils.isNotEmpty(null)).toBe(false);
      expect(arrayUtils.isNotEmpty(undefined)).toBe(false);
    });

    it('should return false for empty arrays', () => {
      expect(arrayUtils.isNotEmpty([])).toBe(false);
    });

    it('should return true for non-empty arrays', () => {
      expect(arrayUtils.isNotEmpty([1, 2, 3])).toBe(true);
      expect(arrayUtils.isNotEmpty(['a'])).toBe(true);
      expect(arrayUtils.isNotEmpty([null])).toBe(true);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      expect(arrayUtils.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(arrayUtils.chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
      expect(arrayUtils.chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    it('should return empty array when input is empty', () => {
      expect(arrayUtils.chunk([], 2)).toEqual([]);
    });

    it('should return original array as single chunk when size exceeds array length', () => {
      expect(arrayUtils.chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    });

    it('should throw error when chunk size is less than 1', () => {
      expect(() => arrayUtils.chunk([1, 2, 3], 0)).toThrow();
      expect(() => arrayUtils.chunk([1, 2, 3], -1)).toThrow();
    });

    it('should handle arrays of different types', () => {
      expect(arrayUtils.chunk(['a', 'b', 'c', 'd'], 2)).toEqual([['a', 'b'], ['c', 'd']]);
      expect(arrayUtils.chunk([true, false, true], 2)).toEqual([[true, false], [true]]);
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      expect(arrayUtils.flatten([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should flatten to specified depth', () => {
      expect(arrayUtils.flatten([1, [2, 3], [4, [5, 6]]], 1)).toEqual([1, 2, 3, 4, [5, 6]]);
    });

    it('should return empty array when input is empty', () => {
      expect(arrayUtils.flatten([])).toEqual([]);
    });

    it('should handle arrays with no nesting', () => {
      expect(arrayUtils.flatten([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('unique', () => {
    it('should remove duplicate elements', () => {
      expect(arrayUtils.unique([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4]);
      expect(arrayUtils.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array when input is empty', () => {
      expect(arrayUtils.unique([])).toEqual([]);
    });

    it('should handle arrays with no duplicates', () => {
      expect(arrayUtils.unique([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle arrays with different types', () => {
      expect(arrayUtils.unique([1, '1', true, 1, true])).toEqual([1, '1', true]);
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates based on key selector', () => {
      const people = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice 2' }
      ];
      expect(arrayUtils.uniqueBy(people, p => p.id)).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);
    });

    it('should return empty array when input is empty', () => {
      expect(arrayUtils.uniqueBy([], p => p.id)).toEqual([]);
    });

    it('should throw error when keySelector is not a function', () => {
      expect(() => arrayUtils.uniqueBy([1, 2, 3], 'id' as any)).toThrow();
    });

    it('should handle complex key selectors', () => {
      const items = [
        { user: { id: 1 }, value: 'a' },
        { user: { id: 2 }, value: 'b' },
        { user: { id: 1 }, value: 'c' }
      ];
      expect(arrayUtils.uniqueBy(items, item => item.user.id)).toEqual([
        { user: { id: 1 }, value: 'a' },
        { user: { id: 2 }, value: 'b' }
      ]);
    });
  });

  describe('groupBy', () => {
    it('should group elements by key selector', () => {
      const people = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
        { id: 4, category: 'C' }
      ];
      
      const result = arrayUtils.groupBy(people, p => p.category);
      expect(result.get('A')).toEqual([
        { id: 1, category: 'A' },
        { id: 3, category: 'A' }
      ]);
      expect(result.get('B')).toEqual([{ id: 2, category: 'B' }]);
      expect(result.get('C')).toEqual([{ id: 4, category: 'C' }]);
    });

    it('should return empty map when input is empty', () => {
      expect(arrayUtils.groupBy([], p => p.category).size).toBe(0);
    });

    it('should throw error when keySelector is not a function', () => {
      expect(() => arrayUtils.groupBy([1, 2, 3], 'category' as any)).toThrow();
    });
  });

  describe('sortBy', () => {
    it('should sort elements by key selector in ascending order', () => {
      const people = [
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      
      expect(arrayUtils.sortBy(people, p => p.id)).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ]);
    });

    it('should sort elements by key selector in descending order', () => {
      const people = [
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' },
        { id: 2, name: 'Bob' }
      ];
      
      expect(arrayUtils.sortBy(people, p => p.id, 'desc')).toEqual([
        { id: 3, name: 'Charlie' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' }
      ]);
    });

    it('should return empty array when input is empty', () => {
      expect(arrayUtils.sortBy([], p => p.id)).toEqual([]);
    });

    it('should throw error when keySelector is not a function', () => {
      expect(() => arrayUtils.sortBy([1, 2, 3], 'id' as any)).toThrow();
    });

    it('should handle string key selectors', () => {
      const people = [
        { id: 1, name: 'Charlie' },
        { id: 2, name: 'Alice' },
        { id: 3, name: 'Bob' }
      ];
      
      expect(arrayUtils.sortBy(people, p => p.name)).toEqual([
        { id: 2, name: 'Alice' },
        { id: 3, name: 'Bob' },
        { id: 1, name: 'Charlie' }
      ]);
    });
  });

  describe('paginate', () => {
    it('should paginate array with default values', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const result = arrayUtils.paginate(items);
      
      expect(result.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.total).toBe(12);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
    });

    it('should paginate array with custom page and limit', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const result = arrayUtils.paginate(items, 2, 5);
      
      expect(result.data).toEqual([6, 7, 8, 9, 10]);
      expect(result.total).toBe(12);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty data for empty array', () => {
      const result = arrayUtils.paginate([]);
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should throw error when page is less than 1', () => {
      expect(() => arrayUtils.paginate([1, 2, 3], 0)).toThrow();
      expect(() => arrayUtils.paginate([1, 2, 3], -1)).toThrow();
    });

    it('should throw error when limit is less than 1', () => {
      expect(() => arrayUtils.paginate([1, 2, 3], 1, 0)).toThrow();
      expect(() => arrayUtils.paginate([1, 2, 3], 1, -1)).toThrow();
    });

    it('should return empty data when page exceeds totalPages', () => {
      const items = [1, 2, 3, 4, 5];
      const result = arrayUtils.paginate(items, 3, 2);
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(5);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('difference', () => {
    it('should return elements in first array not in second array', () => {
      expect(arrayUtils.difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
      expect(arrayUtils.difference(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
    });

    it('should return empty array when first array is empty', () => {
      expect(arrayUtils.difference([], [1, 2, 3])).toEqual([]);
    });

    it('should return copy of first array when second array is empty', () => {
      expect(arrayUtils.difference([1, 2, 3], [])).toEqual([1, 2, 3]);
    });

    it('should handle arrays with different types', () => {
      expect(arrayUtils.difference([1, '2', 3], [1, 2])).toEqual(['2', 3]);
    });
  });

  describe('intersection', () => {
    it('should return elements common to both arrays', () => {
      expect(arrayUtils.intersection([1, 2, 3, 4], [2, 4, 5])).toEqual([2, 4]);
      expect(arrayUtils.intersection(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
    });

    it('should return empty array when either array is empty', () => {
      expect(arrayUtils.intersection([], [1, 2, 3])).toEqual([]);
      expect(arrayUtils.intersection([1, 2, 3], [])).toEqual([]);
    });

    it('should return empty array when there is no intersection', () => {
      expect(arrayUtils.intersection([1, 2, 3], [4, 5, 6])).toEqual([]);
    });

    it('should handle arrays with different types', () => {
      expect(arrayUtils.intersection([1, '2', 3], [1, 2, '2'])).toEqual([1, '2']);
    });
  });

  describe('sum', () => {
    it('should sum array of numbers', () => {
      expect(arrayUtils.sum([1, 2, 3, 4])).toBe(10);
      expect(arrayUtils.sum([1.1, 2.2, 3.3])).toBeCloseTo(6.6);
    });

    it('should return 0 for empty array', () => {
      expect(arrayUtils.sum([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(arrayUtils.sum([1, -2, 3, -4])).toBe(-2);
    });
  });

  describe('sumBy', () => {
    it('should sum values selected by selector function', () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 }
      ];
      
      expect(arrayUtils.sumBy(items, item => item.value)).toBe(60);
    });

    it('should return 0 for empty array', () => {
      expect(arrayUtils.sumBy([], item => item.value)).toBe(0);
    });

    it('should throw error when selector is not a function', () => {
      expect(() => arrayUtils.sumBy([1, 2, 3], 'value' as any)).toThrow();
    });

    it('should handle complex selectors', () => {
      const items = [
        { user: { stats: { points: 10 } } },
        { user: { stats: { points: 20 } } },
        { user: { stats: { points: 30 } } }
      ];
      
      expect(arrayUtils.sumBy(items, item => item.user.stats.points)).toBe(60);
    });
  });

  describe('average', () => {
    it('should calculate average of array of numbers', () => {
      expect(arrayUtils.average([1, 2, 3, 4])).toBe(2.5);
      expect(arrayUtils.average([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
    });

    it('should return 0 for empty array', () => {
      expect(arrayUtils.average([])).toBe(0);
    });

    it('should handle arrays with single value', () => {
      expect(arrayUtils.average([5])).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(arrayUtils.average([10, -10])).toBe(0);
    });
  });

  describe('averageBy', () => {
    it('should calculate average of values selected by selector function', () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 }
      ];
      
      expect(arrayUtils.averageBy(items, item => item.value)).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(arrayUtils.averageBy([], item => item.value)).toBe(0);
    });

    it('should throw error when selector is not a function', () => {
      expect(() => arrayUtils.averageBy([1, 2, 3], 'value' as any)).toThrow();
    });

    it('should handle complex selectors', () => {
      const items = [
        { user: { stats: { points: 10 } } },
        { user: { stats: { points: 20 } } },
        { user: { stats: { points: 30 } } }
      ];
      
      expect(arrayUtils.averageBy(items, item => item.user.stats.points)).toBe(20);
    });
  });

  describe('min', () => {
    it('should find minimum value in array', () => {
      expect(arrayUtils.min([3, 1, 4, 2])).toBe(1);
      expect(arrayUtils.min([5, 5, 5])).toBe(5);
    });

    it('should return undefined for empty array', () => {
      expect(arrayUtils.min([])).toBeUndefined();
    });

    it('should handle negative numbers', () => {
      expect(arrayUtils.min([1, -3, 2, -5])).toBe(-5);
    });
  });

  describe('minBy', () => {
    it('should find item with minimum value selected by selector function', () => {
      const items = [
        { id: 1, value: 30 },
        { id: 2, value: 10 },
        { id: 3, value: 20 }
      ];
      
      expect(arrayUtils.minBy(items, item => item.value)).toEqual({ id: 2, value: 10 });
    });

    it('should return undefined for empty array', () => {
      expect(arrayUtils.minBy([], item => item.value)).toBeUndefined();
    });

    it('should throw error when selector is not a function', () => {
      expect(() => arrayUtils.minBy([1, 2, 3], 'value' as any)).toThrow();
    });

    it('should return first item for array with single item', () => {
      const item = { id: 1, value: 10 };
      expect(arrayUtils.minBy([item], i => i.value)).toBe(item);
    });

    it('should handle complex selectors', () => {
      const items = [
        { user: { stats: { points: 30 } } },
        { user: { stats: { points: 10 } } },
        { user: { stats: { points: 20 } } }
      ];
      
      expect(arrayUtils.minBy(items, item => item.user.stats.points)).toBe(items[1]);
    });
  });

  describe('max', () => {
    it('should find maximum value in array', () => {
      expect(arrayUtils.max([3, 1, 4, 2])).toBe(4);
      expect(arrayUtils.max([5, 5, 5])).toBe(5);
    });

    it('should return undefined for empty array', () => {
      expect(arrayUtils.max([])).toBeUndefined();
    });

    it('should handle negative numbers', () => {
      expect(arrayUtils.max([-1, -3, -2, -5])).toBe(-1);
    });
  });

  describe('maxBy', () => {
    it('should find item with maximum value selected by selector function', () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 30 },
        { id: 3, value: 20 }
      ];
      
      expect(arrayUtils.maxBy(items, item => item.value)).toEqual({ id: 2, value: 30 });
    });

    it('should return undefined for empty array', () => {
      expect(arrayUtils.maxBy([], item => item.value)).toBeUndefined();
    });

    it('should throw error when selector is not a function', () => {
      expect(() => arrayUtils.maxBy([1, 2, 3], 'value' as any)).toThrow();
    });

    it('should return first item for array with single item', () => {
      const item = { id: 1, value: 10 };
      expect(arrayUtils.maxBy([item], i => i.value)).toBe(item);
    });

    it('should handle complex selectors', () => {
      const items = [
        { user: { stats: { points: 10 } } },
        { user: { stats: { points: 30 } } },
        { user: { stats: { points: 20 } } }
      ];
      
      expect(arrayUtils.maxBy(items, item => item.user.stats.points)).toBe(items[1]);
    });
  });

  describe('shuffle', () => {
    it('should return a new array with same elements in different order', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = arrayUtils.shuffle(original);
      
      expect(shuffled).not.toBe(original); // Not the same array reference
      expect(shuffled.sort()).toEqual(original.sort()); // Same elements
      
      // This test could theoretically fail if shuffle randomly gives back the same order
      // But it's very unlikely with an array of 5 elements
      const anotherShuffle = arrayUtils.shuffle(original);
      expect(JSON.stringify(shuffled) !== JSON.stringify(original) || 
             JSON.stringify(anotherShuffle) !== JSON.stringify(original)).toBeTruthy();
    });

    it('should return empty array when input is empty', () => {
      expect(arrayUtils.shuffle([])).toEqual([]);
    });

    it('should return same element for single-element arrays', () => {
      expect(arrayUtils.shuffle([1])).toEqual([1]);
    });
  });

  describe('range', () => {
    it('should create array of numbers in specified range', () => {
      expect(arrayUtils.range(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(arrayUtils.range(5, 1, -1)).toEqual([5, 4, 3, 2, 1]);
    });

    it('should create array with specified step', () => {
      expect(arrayUtils.range(1, 10, 2)).toEqual([1, 3, 5, 7, 9]);
      expect(arrayUtils.range(10, 1, -3)).toEqual([10, 7, 4, 1]);
    });

    it('should throw error when step is zero', () => {
      expect(() => arrayUtils.range(1, 5, 0)).toThrow();
    });

    it('should throw error when step direction is wrong', () => {
      expect(() => arrayUtils.range(1, 5, -1)).toThrow();
      expect(() => arrayUtils.range(5, 1, 1)).toThrow();
    });

    it('should handle single value range', () => {
      expect(arrayUtils.range(5, 5)).toEqual([5]);
    });
  });

  describe('zip', () => {
    it('should zip multiple arrays together', () => {
      expect(arrayUtils.zip([1, 2, 3], ['a', 'b', 'c'])).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
      expect(arrayUtils.zip([1, 2], ['a', 'b'], [true, false])).toEqual([[1, 'a', true], [2, 'b', false]]);
    });

    it('should return empty array when any input array is empty', () => {
      expect(arrayUtils.zip([1, 2], [])).toEqual([]);
      expect(arrayUtils.zip([], [1, 2])).toEqual([]);
    });

    it('should use the shortest array length', () => {
      expect(arrayUtils.zip([1, 2, 3], ['a', 'b'])).toEqual([[1, 'a'], [2, 'b']]);
    });

    it('should handle arrays of different types', () => {
      expect(arrayUtils.zip([1, 2], ['a', 'b'], [true, false])).toEqual([[1, 'a', true], [2, 'b', false]]);
    });
  });

  describe('partition', () => {
    it('should split array into two groups based on predicate', () => {
      const result = arrayUtils.partition([1, 2, 3, 4, 5], x => x % 2 === 0);
      expect(result).toEqual([[2, 4], [1, 3, 5]]);
    });

    it('should return two empty arrays when input is empty', () => {
      expect(arrayUtils.partition([], x => x > 0)).toEqual([[], []]);
    });

    it('should throw error when predicate is not a function', () => {
      expect(() => arrayUtils.partition([1, 2, 3], 'even' as any)).toThrow();
    });

    it('should handle array of objects', () => {
      const items = [
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true }
      ];
      
      const [active, inactive] = arrayUtils.partition(items, item => item.active);
      expect(active).toEqual([items[0], items[2]]);
      expect(inactive).toEqual([items[1]]);
    });
  });
});

describe('String Utilities', () => {
  describe('isEmpty', () => {
    it('should return true for null or undefined strings', () => {
      expect(stringUtils.isEmpty(null)).toBe(true);
      expect(stringUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty strings or whitespace', () => {
      expect(stringUtils.isEmpty('')).toBe(true);
      expect(stringUtils.isEmpty('   ')).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(stringUtils.isEmpty('hello')).toBe(false);
      expect(stringUtils.isEmpty(' world ')).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return false for null or undefined strings', () => {
      expect(stringUtils.isNotEmpty(null)).toBe(false);
      expect(stringUtils.isNotEmpty(undefined)).toBe(false);
    });

    it('should return false for empty strings or whitespace', () => {
      expect(stringUtils.isNotEmpty('')).toBe(false);
      expect(stringUtils.isNotEmpty('   ')).toBe(false);
    });

    it('should return true for non-empty strings', () => {
      expect(stringUtils.isNotEmpty('hello')).toBe(true);
      expect(stringUtils.isNotEmpty(' world ')).toBe(true);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter of string', () => {
      expect(stringUtils.capitalize('hello')).toBe('Hello');
      expect(stringUtils.capitalize('world')).toBe('World');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.capitalize(null)).toBe('');
      expect(stringUtils.capitalize(undefined)).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(stringUtils.capitalize('')).toBe('');
      expect(stringUtils.capitalize('   ')).toBe('');
    });

    it('should handle strings that already start with uppercase', () => {
      expect(stringUtils.capitalize('Hello')).toBe('Hello');
    });

    it('should not change characters after the first one', () => {
      expect(stringUtils.capitalize('hELLO')).toBe('HELLO');
    });
  });

  describe('truncate', () => {
    it('should truncate string to specified length with suffix', () => {
      expect(stringUtils.truncate('Hello world', 5)).toBe('He...');
      expect(stringUtils.truncate('Long string that needs truncation', 15)).toBe('Long string t...');
    });

    it('should use custom suffix if provided', () => {
      expect(stringUtils.truncate('Hello world', 5, '---')).toBe('He---');
      expect(stringUtils.truncate('Testing', 4, '!')).toBe('Tes!');
    });

    it('should return original string if shorter than maxLength', () => {
      expect(stringUtils.truncate('Hello', 10)).toBe('Hello');
      expect(stringUtils.truncate('Test', 10, '...')).toBe('Test');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.truncate(null)).toBe('');
      expect(stringUtils.truncate(undefined)).toBe('');
    });

    it('should use default maxLength if invalid length is provided', () => {
      expect(stringUtils.truncate('Hello world', -5)).toBe('Hello world');
      expect(stringUtils.truncate('Hello world', 0)).toBe('Hello world');
    });
  });

  describe('removeNonDigits', () => {
    it('should remove all non-digit characters', () => {
      expect(stringUtils.removeNonDigits('123abc456')).toBe('123456');
      expect(stringUtils.removeNonDigits('Phone: (123) 456-7890')).toBe('1234567890');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.removeNonDigits(null)).toBe('');
      expect(stringUtils.removeNonDigits(undefined)).toBe('');
    });

    it('should return empty string when input has no digits', () => {
      expect(stringUtils.removeNonDigits('abc')).toBe('');
      expect(stringUtils.removeNonDigits('!@#$%')).toBe('');
    });

    it('should return same string when input has only digits', () => {
      expect(stringUtils.removeNonDigits('12345')).toBe('12345');
    });
  });

  describe('removeSpecialCharacters', () => {
    it('should remove special characters', () => {
      expect(stringUtils.removeSpecialCharacters('Hello, World!')).toBe('HelloWorld');
      expect(stringUtils.removeSpecialCharacters('Test@123#')).toBe('Test123');
    });

    it('should keep allowed special characters', () => {
      expect(stringUtils.removeSpecialCharacters('Hello, World!', ', ')).toBe('Hello, World');
      expect(stringUtils.removeSpecialCharacters('Test@123#', '@#')).toBe('Test@123#');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.removeSpecialCharacters(null)).toBe('');
      expect(stringUtils.removeSpecialCharacters(undefined)).toBe('');
    });

    it('should handle strings with no special characters', () => {
      expect(stringUtils.removeSpecialCharacters('HelloWorld')).toBe('HelloWorld');
      expect(stringUtils.removeSpecialCharacters('Test123')).toBe('Test123');
    });
  });

  describe('normalizeString', () => {
    it('should convert to lowercase, remove extra spaces, and trim', () => {
      expect(stringUtils.normalizeString('  HELLO  world  ')).toBe('hello world');
      expect(stringUtils.normalizeString('MULTIPLE   SPACES')).toBe('multiple spaces');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.normalizeString(null)).toBe('');
      expect(stringUtils.normalizeString(undefined)).toBe('');
    });

    it('should handle strings that are already normalized', () => {
      expect(stringUtils.normalizeString('hello world')).toBe('hello world');
    });

    it('should handle strings with only whitespace', () => {
      expect(stringUtils.normalizeString('   ')).toBe('');
    });
  });

  describe('camelToSnakeCase', () => {
    it('should convert camelCase to snake_case', () => {
      expect(stringUtils.camelToSnakeCase('helloWorld')).toBe('hello_world');
      expect(stringUtils.camelToSnakeCase('firstName')).toBe('first_name');
      expect(stringUtils.camelToSnakeCase('HTTPRequest')).toBe('h_t_t_p_request');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.camelToSnakeCase(null)).toBe('');
      expect(stringUtils.camelToSnakeCase(undefined)).toBe('');
    });

    it('should handle strings with no uppercase letters', () => {
      expect(stringUtils.camelToSnakeCase('hello')).toBe('hello');
    });

    it('should handle strings that start with uppercase letters', () => {
      expect(stringUtils.camelToSnakeCase('HelloWorld')).toBe('_hello_world');
    });
  });

  describe('snakeToCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(stringUtils.snakeToCamelCase('hello_world')).toBe('helloWorld');
      expect(stringUtils.snakeToCamelCase('first_name')).toBe('firstName');
      expect(stringUtils.snakeToCamelCase('http_request')).toBe('httpRequest');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.snakeToCamelCase(null)).toBe('');
      expect(stringUtils.snakeToCamelCase(undefined)).toBe('');
    });

    it('should handle strings with no underscores', () => {
      expect(stringUtils.snakeToCamelCase('hello')).toBe('hello');
    });

    it('should handle consecutive underscores', () => {
      expect(stringUtils.snakeToCamelCase('hello__world')).toBe('helloWorld');
    });
  });

  describe('kebabToCamelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(stringUtils.kebabToCamelCase('hello-world')).toBe('helloWorld');
      expect(stringUtils.kebabToCamelCase('first-name')).toBe('firstName');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.kebabToCamelCase(null)).toBe('');
      expect(stringUtils.kebabToCamelCase(undefined)).toBe('');
    });

    it('should handle strings with no hyphens', () => {
      expect(stringUtils.kebabToCamelCase('hello')).toBe('hello');
    });

    it('should handle consecutive hyphens', () => {
      expect(stringUtils.kebabToCamelCase('hello--world')).toBe('helloWorld');
    });
  });

  describe('camelToKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(stringUtils.camelToKebabCase('helloWorld')).toBe('hello-world');
      expect(stringUtils.camelToKebabCase('firstName')).toBe('first-name');
      expect(stringUtils.camelToKebabCase('HTTPRequest')).toBe('h-t-t-p-request');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.camelToKebabCase(null)).toBe('');
      expect(stringUtils.camelToKebabCase(undefined)).toBe('');
    });

    it('should handle strings with no uppercase letters', () => {
      expect(stringUtils.camelToKebabCase('hello')).toBe('hello');
    });

    it('should handle strings that start with uppercase letters', () => {
      expect(stringUtils.camelToKebabCase('HelloWorld')).toBe('-hello-world');
    });
  });

  describe('formatTemplate', () => {
    it('should replace placeholders with values', () => {
      expect(stringUtils.formatTemplate('Hello, ${name}!', { name: 'John' })).toBe('Hello, John!');
      expect(stringUtils.formatTemplate('${greeting}, ${name}!', { greeting: 'Hi', name: 'Jane' })).toBe('Hi, Jane!');
    });

    it('should leave placeholders that don\'t have corresponding values', () => {
      expect(stringUtils.formatTemplate('Hello, ${name}!', {})).toBe('Hello, ${name}!');
      expect(stringUtils.formatTemplate('${greeting}, ${name}!', { greeting: 'Hi' })).toBe('Hi, ${name}!');
    });

    it('should return original template if values is null or undefined', () => {
      expect(stringUtils.formatTemplate('Hello, ${name}!', null)).toBe('Hello, ${name}!');
      expect(stringUtils.formatTemplate('Hello, ${name}!', undefined)).toBe('Hello, ${name}!');
    });

    it('should return empty string if template is null or undefined', () => {
      expect(stringUtils.formatTemplate(null, { name: 'John' })).toBe('');
      expect(stringUtils.formatTemplate(undefined, { name: 'John' })).toBe('');
    });

    it('should handle templates with no placeholders', () => {
      expect(stringUtils.formatTemplate('Hello!', { name: 'John' })).toBe('Hello!');
    });

    it('should handle non-string values', () => {
      expect(stringUtils.formatTemplate('Count: ${count}', { count: 42 })).toBe('Count: 42');
      expect(stringUtils.formatTemplate('Active: ${active}', { active: true })).toBe('Active: true');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      expect(stringUtils.generateRandomString(10).length).toBe(10);
      expect(stringUtils.generateRandomString(20).length).toBe(20);
    });

    it('should generate string using specified charset', () => {
      const onlyA = stringUtils.generateRandomString(10, 'A');
      expect(onlyA).toBe('AAAAAAAAAA');
      
      const digits = stringUtils.generateRandomString(5, '0123456789');
      expect(/^\d{5}$/.test(digits)).toBe(true);
    });

    it('should use default length if length is invalid', () => {
      expect(stringUtils.generateRandomString(0).length).toBe(10);
      expect(stringUtils.generateRandomString(-5).length).toBe(10);
    });

    it('should generate different strings on multiple calls', () => {
      const str1 = stringUtils.generateRandomString(20);
      const str2 = stringUtils.generateRandomString(20);
      expect(str1).not.toBe(str2);
    });
  });

  describe('maskString', () => {
    it('should mask characters in specified range', () => {
      expect(stringUtils.maskString('1234567890', 4, 8)).toBe('1234****90');
      expect(stringUtils.maskString('password', 2, 7)).toBe('pa*****');
    });

    it('should use custom mask character if provided', () => {
      expect(stringUtils.maskString('1234567890', 4, 8, '#')).toBe('1234####90');
      expect(stringUtils.maskString('password', 2, 7, 'x')).toBe('paxxxxx');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.maskString(null)).toBe('');
      expect(stringUtils.maskString(undefined)).toBe('');
    });

    it('should return original string if start is after end', () => {
      expect(stringUtils.maskString('1234567890', 8, 4)).toBe('1234567890');
    });

    it('should return original string if both start and end are 0', () => {
      expect(stringUtils.maskString('1234567890', 0, 0)).toBe('1234567890');
    });

    it('should handle out of range positions', () => {
      expect(stringUtils.maskString('1234', 2, 10)).toBe('12**');
      expect(stringUtils.maskString('1234', -2, 2)).toBe('**34');
    });
  });

  describe('countOccurrences', () => {
    it('should count occurrences of substring in string', () => {
      expect(stringUtils.countOccurrences('hello world', 'l')).toBe(3);
      expect(stringUtils.countOccurrences('hello hello', 'hello')).toBe(2);
      expect(stringUtils.countOccurrences('aaaaa', 'aa')).toBe(2); // Overlapping matches
    });

    it('should return 0 if substring not found', () => {
      expect(stringUtils.countOccurrences('hello world', 'z')).toBe(0);
      expect(stringUtils.countOccurrences('test', 'not found')).toBe(0);
    });

    it('should return 0 if string or search string is null, undefined, or empty', () => {
      expect(stringUtils.countOccurrences(null, 'test')).toBe(0);
      expect(stringUtils.countOccurrences(undefined, 'test')).toBe(0);
      expect(stringUtils.countOccurrences('hello', null)).toBe(0);
      expect(stringUtils.countOccurrences('hello', undefined)).toBe(0);
      expect(stringUtils.countOccurrences('hello', '')).toBe(0);
    });

    it('should be case sensitive', () => {
      expect(stringUtils.countOccurrences('Hello World', 'hello')).toBe(0);
      expect(stringUtils.countOccurrences('Hello World', 'Hello')).toBe(1);
    });
  });

  describe('isNumeric', () => {
    it('should return true for strings with only numeric characters', () => {
      expect(stringUtils.isNumeric('123')).toBe(true);
      expect(stringUtils.isNumeric('0')).toBe(true);
    });

    it('should return false for strings with non-numeric characters', () => {
      expect(stringUtils.isNumeric('123a')).toBe(false);
      expect(stringUtils.isNumeric('12.3')).toBe(false);
      expect(stringUtils.isNumeric('-123')).toBe(false);
    });

    it('should return false for null, undefined, or empty strings', () => {
      expect(stringUtils.isNumeric(null)).toBe(false);
      expect(stringUtils.isNumeric(undefined)).toBe(false);
      expect(stringUtils.isNumeric('')).toBe(false);
      expect(stringUtils.isNumeric('   ')).toBe(false);
    });
  });

  describe('isAlpha', () => {
    it('should return true for strings with only alphabetic characters', () => {
      expect(stringUtils.isAlpha('abc')).toBe(true);
      expect(stringUtils.isAlpha('XYZ')).toBe(true);
      expect(stringUtils.isAlpha('AbCdEf')).toBe(true);
    });

    it('should return false for strings with non-alphabetic characters', () => {
      expect(stringUtils.isAlpha('abc123')).toBe(false);
      expect(stringUtils.isAlpha('abc ')).toBe(false);
      expect(stringUtils.isAlpha('abc-def')).toBe(false);
    });

    it('should return false for null, undefined, or empty strings', () => {
      expect(stringUtils.isAlpha(null)).toBe(false);
      expect(stringUtils.isAlpha(undefined)).toBe(false);
      expect(stringUtils.isAlpha('')).toBe(false);
      expect(stringUtils.isAlpha('   ')).toBe(false);
    });
  });

  describe('isAlphanumeric', () => {
    it('should return true for strings with only alphanumeric characters', () => {
      expect(stringUtils.isAlphanumeric('abc123')).toBe(true);
      expect(stringUtils.isAlphanumeric('XYZ789')).toBe(true);
      expect(stringUtils.isAlphanumeric('123')).toBe(true);
      expect(stringUtils.isAlphanumeric('abc')).toBe(true);
    });

    it('should return false for strings with non-alphanumeric characters', () => {
      expect(stringUtils.isAlphanumeric('abc 123')).toBe(false);
      expect(stringUtils.isAlphanumeric('abc-123')).toBe(false);
      expect(stringUtils.isAlphanumeric('abc_123')).toBe(false);
    });

    it('should return false for null, undefined, or empty strings', () => {
      expect(stringUtils.isAlphanumeric(null)).toBe(false);
      expect(stringUtils.isAlphanumeric(undefined)).toBe(false);
      expect(stringUtils.isAlphanumeric('')).toBe(false);
      expect(stringUtils.isAlphanumeric('   ')).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(stringUtils.escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
      expect(stringUtils.escapeHtml('a & b')).toBe('a &amp; b');
      expect(stringUtils.escapeHtml('John\'s code')).toBe('John&#039;s code');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.escapeHtml(null)).toBe('');
      expect(stringUtils.escapeHtml(undefined)).toBe('');
    });

    it('should not change strings without special characters', () => {
      expect(stringUtils.escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('unescapeHtml', () => {
    it('should unescape HTML entities', () => {
      expect(stringUtils.unescapeHtml('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')).toBe(
        '<script>alert("XSS")</script>'
      );
      expect(stringUtils.unescapeHtml('a &amp; b')).toBe('a & b');
      expect(stringUtils.unescapeHtml('John&#039;s code')).toBe('John\'s code');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.unescapeHtml(null)).toBe('');
      expect(stringUtils.unescapeHtml(undefined)).toBe('');
    });

    it('should not change strings without HTML entities', () => {
      expect(stringUtils.unescapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('slugify', () => {
    it('should convert string to URL-friendly slug', () => {
      expect(stringUtils.slugify('Hello World')).toBe('hello-world');
      expect(stringUtils.slugify('This is a test')).toBe('this-is-a-test');
      expect(stringUtils.slugify('Special!@#$%^&*() Characters')).toBe('special-characters');
    });

    it('should return empty string for null or undefined', () => {
      expect(stringUtils.slugify(null)).toBe('');
      expect(stringUtils.slugify(undefined)).toBe('');
    });

    it('should handle strings with multiple spaces and special characters', () => {
      expect(stringUtils.slugify('  Hello  World!  ')).toBe('hello-world');
      expect(stringUtils.slugify('Multiple---Hyphens')).toBe('multiple-hyphens');
      expect(stringUtils.slugify('-Leading and Trailing-')).toBe('leading-and-trailing');
    });
  });
});

describe('Object Utilities', () => {
  describe('isEmpty', () => {
    it('should return true for null or undefined objects', () => {
      expect(objectUtils.isEmpty(null)).toBe(true);
      expect(objectUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty objects', () => {
      expect(objectUtils.isEmpty({})).toBe(true);
    });

    it('should return false for non-empty objects', () => {
      expect(objectUtils.isEmpty({ a: 1 })).toBe(false);
      expect(objectUtils.isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return false for null or undefined objects', () => {
      expect(objectUtils.isNotEmpty(null)).toBe(false);
      expect(objectUtils.isNotEmpty(undefined)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(objectUtils.isNotEmpty({})).toBe(false);
    });

    it('should return true for non-empty objects', () => {
      expect(objectUtils.isNotEmpty({ a: 1 })).toBe(true);
      expect(objectUtils.isNotEmpty({ key: 'value' })).toBe(true);
    });
  });

  describe('pick', () => {
    it('should create object with only specified properties', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(objectUtils.pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
      expect(objectUtils.pick(obj, ['a'])).toEqual({ a: 1 });
    });

    it('should ignore keys that do not exist in source object', () => {
      const obj = { a: 1, b: 2 };
      expect(objectUtils.pick(obj, ['a', 'z'])).toEqual({ a: 1 });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.pick(null as any, ['a'])).toThrow();
      expect(() => objectUtils.pick({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty source or keys', () => {
      expect(objectUtils.pick({}, ['a'])).toEqual({});
      expect(objectUtils.pick({ a: 1 }, [])).toEqual({});
    });
  });

  describe('omit', () => {
    it('should create object excluding specified properties', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(objectUtils.omit(obj, ['a', 'c'])).toEqual({ b: 2, d: 4 });
      expect(objectUtils.omit(obj, ['a'])).toEqual({ b: 2, c: 3, d: 4 });
    });

    it('should ignore keys that do not exist in source object', () => {
      const obj = { a: 1, b: 2 };
      expect(objectUtils.omit(obj, ['z'])).toEqual({ a: 1, b: 2 });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.omit(null as any, ['a'])).toThrow();
      expect(() => objectUtils.omit({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty source', () => {
      expect(objectUtils.omit({}, ['a'])).toEqual({});
    });

    it('should return clone of original object if keys is empty', () => {
      const obj = { a: 1, b: 2 };
      const result = objectUtils.omit(obj, []);
      expect(result).toEqual(obj);
      expect(result).not.toBe(obj); // Check that it's a new object
    });
  });

  describe('deepClone', () => {
    it('should create deep copy of object', () => {
      const original = { 
        a: 1, 
        b: { c: 2, d: [3, 4] }, 
        e: new Date(), 
        f: [{ g: 5 }] 
      };
      const clone = objectUtils.deepClone(original);
      
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.b).not.toBe(original.b);
      expect(clone.e).not.toBe(original.e);
      expect(clone.f).not.toBe(original.f);
      expect(clone.f[0]).not.toBe(original.f[0]);
    });

    it('should handle primitive values', () => {
      expect(objectUtils.deepClone(5)).toBe(5);
      expect(objectUtils.deepClone("hello")).toBe("hello");
      expect(objectUtils.deepClone(null)).toBe(null);
      expect(objectUtils.deepClone(undefined)).toBe(undefined);
    });

    it('should handle arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const clone = objectUtils.deepClone(original);
      
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone[1]).not.toBe(original[1]);
      expect(clone[2]).not.toBe(original[2]);
    });

    it('should handle Date objects', () => {
      const original = new Date();
      const clone = objectUtils.deepClone(original);
      
      expect(clone.getTime()).toBe(original.getTime());
      expect(clone).not.toBe(original);
    });
  });

  describe('merge', () => {
    it('should deeply merge objects', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { d: 4, e: 5 }, f: 6 };
      
      expect(objectUtils.merge(target, source)).toEqual({
        a: 1,
        b: { c: 2, d: 4, e: 5 },
        f: 6
      });
    });

    it('should merge multiple sources', () => {
      const target = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      
      expect(objectUtils.merge(target, source1, source2)).toEqual({
        a: 1, b: 2, c: 3
      });
    });

    it('should throw error when sources is invalid', () => {
      expect(() => objectUtils.merge({}, null as any)).toThrow();
    });

    it('should handle array values by replacing, not merging', () => {
      const target = { a: [1, 2] };
      const source = { a: [3, 4] };
      
      expect(objectUtils.merge(target, source)).toEqual({
        a: [3, 4]
      });
    });

    it('should create new object and not modify target', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 } };
      
      const result = objectUtils.merge(target, source);
      
      expect(target).toEqual({ a: 1, b: { c: 2 } });
      expect(result).not.toBe(target);
      expect(result.b).not.toBe(target.b);
    });

    it('should handle null or undefined target', () => {
      expect(objectUtils.merge(null as any, { a: 1 })).toEqual({ a: 1 });
      expect(objectUtils.merge(undefined as any, { a: 1 })).toEqual({ a: 1 });
    });

    it('should skip null or undefined sources', () => {
      expect(objectUtils.merge({ a: 1 }, null as any, { b: 2 })).toEqual({ a: 1, b: 2 });
    });
  });

  describe('flatten', () => {
    it('should flatten nested object structure', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        },
        f: 4
      };
      
      expect(objectUtils.flatten(obj)).toEqual({
        'a': 1,
        'b.c': 2,
        'b.d.e': 3,
        'f': 4
      });
    });

    it('should use custom prefix and delimiter', () => {
      const obj = { a: 1, b: { c: 2 } };
      
      expect(objectUtils.flatten(obj, 'prefix')).toEqual({
        'prefix.a': 1,
        'prefix.b.c': 2
      });
      
      expect(objectUtils.flatten(obj, '', '_')).toEqual({
        'a': 1,
        'b_c': 2
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.flatten(null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.flatten({})).toEqual({});
    });

    it('should handle arrays as values', () => {
      const obj = { a: [1, 2, 3], b: { c: [4, 5] } };
      
      expect(objectUtils.flatten(obj)).toEqual({
        'a': [1, 2, 3],
        'b.c': [4, 5]
      });
    });
  });

  describe('unflatten', () => {
    it('should convert flattened object back to nested structure', () => {
      const flat = {
        'a': 1,
        'b.c': 2,
        'b.d.e': 3,
        'f': 4
      };
      
      expect(objectUtils.unflatten(flat)).toEqual({
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        },
        f: 4
      });
    });

    it('should use custom delimiter', () => {
      const flat = {
        'a': 1,
        'b_c': 2,
        'b_d_e': 3
      };
      
      expect(objectUtils.unflatten(flat, '_')).toEqual({
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.unflatten(null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.unflatten({})).toEqual({});
    });

    it('should handle undefined values by skipping them', () => {
      const flat = {
        'a': 1,
        'b.c': undefined
      };
      
      expect(objectUtils.unflatten(flat)).toEqual({
        a: 1
      });
    });
  });

  describe('mapValues', () => {
    it('should transform values using mapping function', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.mapValues(obj, value => value * 2)).toEqual({
        a: 2, b: 4, c: 6
      });
    });

    it('should provide key and object to mapping function', () => {
      const obj = { a: 1, b: 2 };
      
      expect(objectUtils.mapValues(obj, (value, key, object) => {
        return `${key}:${value}:${object === obj}`;
      })).toEqual({
        a: 'a:1:true',
        b: 'b:2:true'
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.mapValues(null as any, v => v)).toThrow();
      expect(() => objectUtils.mapValues({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.mapValues({}, v => v)).toEqual({});
    });
  });

  describe('mapKeys', () => {
    it('should transform keys using mapping function', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.mapKeys(obj, key => key.toUpperCase())).toEqual({
        A: 1, B: 2, C: 3
      });
    });

    it('should provide value and object to mapping function', () => {
      const obj = { a: 1, b: 2 };
      
      expect(objectUtils.mapKeys(obj, (key, value, object) => {
        return `${key}${value}`;
      })).toEqual({
        a1: 1,
        b2: 2
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.mapKeys(null as any, k => k)).toThrow();
      expect(() => objectUtils.mapKeys({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.mapKeys({}, k => k)).toEqual({});
    });
  });

  describe('entries', () => {
    it('should return array of key-value pairs', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.entries(obj)).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ]);
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.entries(null as any)).toThrow();
    });

    it('should return empty array for empty object', () => {
      expect(objectUtils.entries({})).toEqual([]);
    });
  });

  describe('fromEntries', () => {
    it('should create object from array of key-value pairs', () => {
      const entries = [
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ];
      
      expect(objectUtils.fromEntries(entries)).toEqual({
        a: 1, b: 2, c: 3
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.fromEntries(null as any)).toThrow();
    });

    it('should return empty object for empty array', () => {
      expect(objectUtils.fromEntries([])).toEqual({});
    });
  });

  describe('keys', () => {
    it('should return array of object keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.keys(obj)).toEqual(['a', 'b', 'c']);
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.keys(null as any)).toThrow();
    });

    it('should return empty array for empty object', () => {
      expect(objectUtils.keys({})).toEqual([]);
    });
  });

  describe('values', () => {
    it('should return array of object values', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.values(obj)).toEqual([1, 2, 3]);
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.values(null as any)).toThrow();
    });

    it('should return empty array for empty object', () => {
      expect(objectUtils.values({})).toEqual([]);
    });
  });

  describe('hasKey', () => {
    it('should check if object has specific key', () => {
      const obj = { a: 1, b: 2, c: undefined };
      
      expect(objectUtils.hasKey(obj, 'a')).toBe(true);
      expect(objectUtils.hasKey(obj, 'b')).toBe(true);
      expect(objectUtils.hasKey(obj, 'c')).toBe(true);
      expect(objectUtils.hasKey(obj, 'd')).toBe(false);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.hasKey(null as any, 'a')).toThrow();
      expect(() => objectUtils.hasKey({ a: 1 }, undefined as any)).toThrow();
    });

    it('should return false for empty object', () => {
      expect(objectUtils.hasKey({}, 'a')).toBe(false);
    });
  });

  describe('filterKeys', () => {
    it('should create object with keys that satisfy predicate', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.filterKeys(obj, key => key !== 'b')).toEqual({
        a: 1, c: 3
      });
    });

    it('should provide value and object to predicate function', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.filterKeys(obj, (key, value) => value > 1)).toEqual({
        b: 2, c: 3
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.filterKeys(null as any, k => true)).toThrow();
      expect(() => objectUtils.filterKeys({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.filterKeys({}, k => true)).toEqual({});
    });
  });

  describe('filterValues', () => {
    it('should create object with values that satisfy predicate', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.filterValues(obj, value => value > 1)).toEqual({
        b: 2, c: 3
      });
    });

    it('should provide key and object to predicate function', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(objectUtils.filterValues(obj, (value, key) => key !== 'b')).toEqual({
        a: 1, c: 3
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.filterValues(null as any, v => true)).toThrow();
      expect(() => objectUtils.filterValues({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.filterValues({}, v => true)).toEqual({});
    });
  });

  describe('groupBy', () => {
    it('should group object values by key selector', () => {
      const obj = {
        a: { type: 'fruit', name: 'apple' },
        b: { type: 'vegetable', name: 'broccoli' },
        c: { type: 'fruit', name: 'cherry' }
      };
      
      const result = objectUtils.groupBy(obj, value => value.type);
      
      expect(result).toEqual({
        fruit: {
          a: { type: 'fruit', name: 'apple' },
          c: { type: 'fruit', name: 'cherry' }
        },
        vegetable: {
          b: { type: 'vegetable', name: 'broccoli' }
        }
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.groupBy(null as any, v => '')).toThrow();
      expect(() => objectUtils.groupBy({ a: 1 }, null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.groupBy({}, v => '')).toEqual({});
    });
  });

  describe('transform', () => {
    it('should transform object using reducer function', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      const result = objectUtils.transform(
        obj,
        (acc, value, key) => {
          acc[key] = value * 2;
          return acc;
        },
        {}
      );
      
      expect(result).toEqual({ a: 2, b: 4, c: 6 });
    });

    it('should use empty object as initial value when not provided', () => {
      const obj = { a: 1, b: 2 };
      
      const result = objectUtils.transform(
        obj,
        (acc, value, key) => {
          acc[`key_${key}`] = value;
          return acc;
        }
      );
      
      expect(result).toEqual({ key_a: 1, key_b: 2 });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.transform(null as any, () => ({}))).toThrow();
      expect(() => objectUtils.transform({ a: 1 }, null as any)).toThrow();
    });

    it('should return initial value for empty object', () => {
      const initialValue = { result: 'empty' };
      expect(objectUtils.transform({}, () => ({}), initialValue)).toBe(initialValue);
    });
  });

  describe('isEqual', () => {
    it('should check objects for deep equality', () => {
      expect(objectUtils.isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(objectUtils.isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(objectUtils.isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
      expect(objectUtils.isEqual([1, 2, { a: 3 }], [1, 2, { a: 3 }])).toBe(true);
    });

    it('should return false for different objects', () => {
      expect(objectUtils.isEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(objectUtils.isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(objectUtils.isEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
      expect(objectUtils.isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should handle null, undefined and primitive values', () => {
      expect(objectUtils.isEqual(null, null)).toBe(true);
      expect(objectUtils.isEqual(undefined, undefined)).toBe(true);
      expect(objectUtils.isEqual(null, undefined)).toBe(false);
      expect(objectUtils.isEqual(5, 5)).toBe(true);
      expect(objectUtils.isEqual('hello', 'hello')).toBe(true);
      expect(objectUtils.isEqual(5, '5')).toBe(false);
    });

    it('should handle Date objects', () => {
      const date1 = new Date(2023, 0, 1);
      const date2 = new Date(2023, 0, 1);
      const date3 = new Date(2023, 0, 2);
      
      expect(objectUtils.isEqual(date1, date2)).toBe(true);
      expect(objectUtils.isEqual(date1, date3)).toBe(false);
    });
  });

  describe('diff', () => {
    it('should find differences between two objects', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 3, d: 4 };
      
      const result = objectUtils.diff(obj1, obj2);
      
      expect(result).toEqual({
        added: { d: 4 },
        removed: { c: 3 },
        updated: { b: 3 }
      });
    });

    it('should handle empty objects', () => {
      const obj1 = {};
      const obj2 = { a: 1, b: 2 };
      
      expect(objectUtils.diff(obj1, obj2)).toEqual({
        added: { a: 1, b: 2 },
        removed: {},
        updated: {}
      });
      
      expect(objectUtils.diff(obj2, obj1)).toEqual({
        added: {},
        removed: { a: 1, b: 2 },
        updated: {}
      });
    });

    it('should handle nested objects', () => {
      const obj1 = { a: { b: 1, c: 2 } };
      const obj2 = { a: { b: 1, c: 3 } };
      
      const result = objectUtils.diff(obj1, obj2);
      
      expect(result).toEqual({
        added: {},
        removed: {},
        updated: { a: { b: 1, c: 3 } }
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.diff(null as any, {})).toThrow();
      expect(() => objectUtils.diff({}, null as any)).toThrow();
    });
  });

  describe('getNestedValue', () => {
    it('should get value from nested object using path', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      };
      
      expect(objectUtils.getNestedValue(obj, 'a')).toBe(1);
      expect(objectUtils.getNestedValue(obj, 'b.c')).toBe(2);
      expect(objectUtils.getNestedValue(obj, 'b.d.e')).toBe(3);
    });

    it('should return default value when path does not exist', () => {
      const obj = { a: 1 };
      
      expect(objectUtils.getNestedValue(obj, 'b')).toBeUndefined();
      expect(objectUtils.getNestedValue(obj, 'b.c')).toBeUndefined();
      expect(objectUtils.getNestedValue(obj, 'b', 'default')).toBe('default');
    });

    it('should handle null or undefined objects', () => {
      expect(objectUtils.getNestedValue(null, 'a')).toBeUndefined();
      expect(objectUtils.getNestedValue(undefined, 'a')).toBeUndefined();
      expect(objectUtils.getNestedValue(null, 'a', 'default')).toBe('default');
    });

    it('should handle empty paths', () => {
      expect(objectUtils.getNestedValue({ a: 1 }, '')).toBeUndefined();
    });
  });

  describe('setNestedValue', () => {
    it('should set value in nested object using path', () => {
      const obj = {
        a: 1,
        b: {
          c: 2
        }
      };
      
      const result1 = objectUtils.setNestedValue(obj, 'a', 10);
      expect(result1).toEqual({
        a: 10,
        b: {
          c: 2
        }
      });
      
      const result2 = objectUtils.setNestedValue(obj, 'b.c', 20);
      expect(result2).toEqual({
        a: 1,
        b: {
          c: 20
        }
      });
      
      const result3 = objectUtils.setNestedValue(obj, 'b.d.e', 30);
      expect(result3).toEqual({
        a: 1,
        b: {
          c: 2,
          d: {
            e: 30
          }
        }
      });
    });

    it('should not modify original object', () => {
      const obj = { a: 1, b: { c: 2 } };
      objectUtils.setNestedValue(obj, 'b.c', 20);
      
      expect(obj).toEqual({ a: 1, b: { c: 2 } });
    });

    it('should throw error for invalid inputs', () => {
      expect(() => objectUtils.setNestedValue(null as any, 'a', 1)).toThrow();
      expect(() => objectUtils.setNestedValue({}, null as any, 1)).toThrow();
    });

    it('should create intermediate objects as needed', () => {
      const obj = { a: 1 };
      
      const result = objectUtils.setNestedValue(obj, 'b.c.d', 2);
      
      expect(result).toEqual({
        a: 1,
        b: {
          c: {
            d: 2
          }
        }
      });
    });
  });

  describe('removeEmpty', () => {
    it('should remove null, undefined, and empty string values', () => {
      const obj = {
        a: 1,
        b: '',
        c: null,
        d: undefined,
        e: 0,
        f: false
      };
      
      expect(objectUtils.removeEmpty(obj)).toEqual({
        a: 1,
        e: 0,
        f: false
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.removeEmpty(null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.removeEmpty({})).toEqual({});
    });

    it('should handle objects with only empty values', () => {
      expect(objectUtils.removeEmpty({ a: null, b: undefined, c: '' })).toEqual({});
    });
  });

  describe('removeNulls', () => {
    it('should remove null and undefined values', () => {
      const obj = {
        a: 1,
        b: '',
        c: null,
        d: undefined,
        e: 0,
        f: false
      };
      
      expect(objectUtils.removeNulls(obj)).toEqual({
        a: 1,
        b: '',
        e: 0,
        f: false
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.removeNulls(null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.removeNulls({})).toEqual({});
    });

    it('should handle objects with only null values', () => {
      expect(objectUtils.removeNulls({ a: null, b: undefined })).toEqual({});
    });
  });

  describe('toCamelCase', () => {
    it('should convert object keys from snake_case to camelCase', () => {
      const obj = {
        first_name: 'John',
        last_name: 'Doe',
        contact_info: {
          phone_number: '123-456-7890',
          email_address: 'john@example.com'
        },
        favorite_colors: ['blue', 'green']
      };
      
      expect(objectUtils.toCamelCase(obj)).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        contactInfo: {
          phoneNumber: '123-456-7890',
          emailAddress: 'john@example.com'
        },
        favoriteColors: ['blue', 'green']
      });
    });

    it('should handle arrays of objects', () => {
      const obj = {
        users: [
          { user_id: 1, first_name: 'John' },
          { user_id: 2, first_name: 'Jane' }
        ]
      };
      
      expect(objectUtils.toCamelCase(obj)).toEqual({
        users: [
          { userId: 1, firstName: 'John' },
          { userId: 2, firstName: 'Jane' }
        ]
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.toCamelCase(null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.toCamelCase({})).toEqual({});
    });
  });

  describe('toSnakeCase', () => {
    it('should convert object keys from camelCase to snake_case', () => {
      const obj = {
        firstName: 'John',
        lastName: 'Doe',
        contactInfo: {
          phoneNumber: '123-456-7890',
          emailAddress: 'john@example.com'
        },
        favoriteColors: ['blue', 'green']
      };
      
      expect(objectUtils.toSnakeCase(obj)).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        contact_info: {
          phone_number: '123-456-7890',
          email_address: 'john@example.com'
        },
        favorite_colors: ['blue', 'green']
      });
    });

    it('should handle arrays of objects', () => {
      const obj = {
        users: [
          { userId: 1, firstName: 'John' },
          { userId: 2, firstName: 'Jane' }
        ]
      };
      
      expect(objectUtils.toSnakeCase(obj)).toEqual({
        users: [
          { user_id: 1, first_name: 'John' },
          { user_id: 2, first_name: 'Jane' }
        ]
      });
    });

    it('should throw error for invalid input', () => {
      expect(() => objectUtils.toSnakeCase(null as any)).toThrow();
    });

    it('should return empty object for empty input', () => {
      expect(objectUtils.toSnakeCase({})).toEqual({});
    });
  });
});

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format Date objects to ISO8601 date strings', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(dateUtils.formatDate(date)).toBe('2023-01-15');
    });

    it('should handle string date inputs', () => {
      expect(dateUtils.formatDate('2023-01-15T00:00:00.000Z')).toBe('2023-01-15');
    });

    it('should handle numeric timestamp inputs', () => {
      const timestamp = new Date(2023, 0, 15).getTime();
      expect(dateUtils.formatDate(timestamp)).toBe('2023-01-15');
    });

    it('should return null for invalid inputs', () => {
      expect(dateUtils.formatDate(null)).toBeNull();
      expect(dateUtils.formatDate(undefined)).toBeNull();
      expect(dateUtils.formatDate('invalid-date')).toBeNull();
      expect(dateUtils.formatDate(new Date('invalid'))).toBeNull();
    });
  });

  describe('parseDate', () => {
    it('should parse string dates with default format', () => {
      const result = dateUtils.parseDate('2023-01-15');
      expect(result instanceof Date).toBe(true);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should parse string dates with custom format', () => {
      const result = dateUtils.parseDate('15/01/2023', 'dd/MM/yyyy');
      expect(result instanceof Date).toBe(true);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should parse ISO formatted dates without format string', () => {
      const result = dateUtils.parseDate('2023-01-15T12:30:45.000Z');
      expect(result instanceof Date).toBe(true);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should return null for invalid inputs', () => {
      expect(dateUtils.parseDate(null)).toBeNull();
      expect(dateUtils.parseDate(undefined)).toBeNull();
      expect(dateUtils.parseDate('invalid-date')).toBeNull();
      expect(dateUtils.parseDate('2023/01/15')).not.toBeNull(); // ISO can parse this
      expect(dateUtils.parseDate('15/01/2023')).toBeNull(); // Not ISO format
    });
  });

  describe('formatDisplayDate', () => {
    it('should format dates for display with default format', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(dateUtils.formatDisplayDate(date)).toBe('01/15/2023');
    });

    it('should format dates with custom format', () => {
      const date = new Date(2023, 0, 15);
      expect(dateUtils.formatDisplayDate(date, 'MM-dd-yyyy')).toBe('01-15-2023');
    });

    it('should handle various input types', () => {
      expect(dateUtils.formatDisplayDate('2023-01-15T00:00:00.000Z')).toBe('01/15/2023');
      expect(dateUtils.formatDisplayDate(new Date(2023, 0, 15).getTime())).toBe('01/15/2023');
    });

    it('should return empty string for invalid inputs', () => {
      expect(dateUtils.formatDisplayDate(null)).toBe('');
      expect(dateUtils.formatDisplayDate(undefined)).toBe('');
      expect(dateUtils.formatDisplayDate('invalid-date')).toBe('');
      expect(dateUtils.formatDisplayDate(new Date('invalid'))).toBe('');
    });
  });

  describe('formatDisplayDateTime', () => {
    it('should format date and time for display with default format', () => {
      // Use specific time to avoid timezone issues in testing
      const date = new Date(2023, 0, 15, 14, 30, 0); // Jan 15, 2023, 2:30 PM
      const result = dateUtils.formatDisplayDateTime(date);
      
      // Test containing the date part - avoid exact time comparison due to timezone conversions
      expect(result).toContain('01/15/2023');
    });

    it('should format with custom format', () => {
      const date = new Date(2023, 0, 15, 14, 30, 0);
      const result = dateUtils.formatDisplayDateTime(date, 'yyyy-MM-dd HH:mm');
      
      // The exact formatted time will depend on the timezone, so we just test it contains the date
      expect(result).toContain('2023-01-15');
    });

    it('should return empty string for invalid inputs', () => {
      expect(dateUtils.formatDisplayDateTime(null)).toBe('');
      expect(dateUtils.formatDisplayDateTime(undefined)).toBe('');
      expect(dateUtils.formatDisplayDateTime('invalid-date')).toBe('');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(dateUtils.isValidDate(new Date())).toBe(true);
      expect(dateUtils.isValidDate('2023-01-15')).toBe(true);
      expect(dateUtils.isValidDate(new Date().getTime())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(dateUtils.isValidDate(null)).toBe(false);
      expect(dateUtils.isValidDate(undefined)).toBe(false);
      expect(dateUtils.isValidDate('invalid-date')).toBe(false);
      expect(dateUtils.isValidDate(new Date('invalid'))).toBe(false);
      expect(dateUtils.isValidDate({})).toBe(false);
      expect(dateUtils.isValidDate('hello')).toBe(false);
    });
  });

  describe('calculateDateDifference', () => {
    it('should calculate difference in days by default', () => {
      const start = new Date(2023, 0, 1); // January 1, 2023
      const end = new Date(2023, 0, 11); // January 11, 2023
      
      expect(dateUtils.calculateDateDifference(start, end)).toBe(10);
    });

    it('should calculate difference in specified units', () => {
      const start = new Date(2023, 0, 1); // January 1, 2023
      const end = new Date(2023, 3, 1); // April 1, 2023
      
      expect(dateUtils.calculateDateDifference(start, end, 'days')).toBe(90);
      expect(dateUtils.calculateDateDifference(start, end, 'months')).toBe(3);
      expect(dateUtils.calculateDateDifference(start, end, 'years')).toBe(0);
      
      const yearEnd = new Date(2024, 0, 1); // January 1, 2024
      expect(dateUtils.calculateDateDifference(start, yearEnd, 'years')).toBe(1);
    });

    it('should handle string and timestamp inputs', () => {
      expect(dateUtils.calculateDateDifference('2023-01-01', '2023-01-11')).toBe(10);
      
      const start = new Date(2023, 0, 1).getTime();
      const end = new Date(2023, 0, 11).getTime();
      expect(dateUtils.calculateDateDifference(start, end)).toBe(10);
    });

    it('should handle negative differences', () => {
      const start = new Date(2023, 0, 11);
      const end = new Date(2023, 0, 1);
      
      expect(dateUtils.calculateDateDifference(start, end)).toBe(-10);
    });

    it('should throw error for invalid dates', () => {
      expect(() => dateUtils.calculateDateDifference('invalid', '2023-01-01')).toThrow(ValidationError);
      expect(() => dateUtils.calculateDateDifference('2023-01-01', 'invalid')).toThrow(ValidationError);
    });
  });

  describe('addToDate', () => {
    it('should add days by default', () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      const result = dateUtils.addToDate(date, 10);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(11);
    });

    it('should add specified time unit', () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      
      const days = dateUtils.addToDate(date, 10, 'days');
      expect(days.getFullYear()).toBe(2023);
      expect(days.getMonth()).toBe(0);
      expect(days.getDate()).toBe(11);
      
      const months = dateUtils.addToDate(date, 3, 'months');
      expect(months.getFullYear()).toBe(2023);
      expect(months.getMonth()).toBe(3); // April
      expect(months.getDate()).toBe(1);
      
      const years = dateUtils.addToDate(date, 2, 'years');
      expect(years.getFullYear()).toBe(2025);
      expect(years.getMonth()).toBe(0);
      expect(years.getDate()).toBe(1);
    });

    it('should handle string and timestamp inputs', () => {
      const result = dateUtils.addToDate('2023-01-01', 10);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(11);
      
      const timestamp = new Date(2023, 0, 1).getTime();
      const timestampResult = dateUtils.addToDate(timestamp, 10);
      expect(timestampResult.getFullYear()).toBe(2023);
      expect(timestampResult.getMonth()).toBe(0);
      expect(timestampResult.getDate()).toBe(11);
    });

    it('should handle negative amounts', () => {
      const date = new Date(2023, 0, 11); // January 11, 2023
      const result = dateUtils.addToDate(date, -10);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('should throw error for invalid dates', () => {
      expect(() => dateUtils.addToDate('invalid', 10)).toThrow(ValidationError);
    });
  });

  describe('getDateRangeFromPreset', () => {
    // Mock current date for consistent testing
    let originalDate: any;
    beforeEach(() => {
      originalDate = global.Date;
      const mockDate = new Date(2023, 0, 15); // January 15, 2023
      // @ts-ignore
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      };
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should generate date range for TODAY preset', () => {
      const range = dateUtils.getDateRangeFromPreset(DateRangePreset.TODAY);
      expect(range.startDate).toBe('2023-01-15');
      expect(range.endDate).toBe('2023-01-15');
    });

    it('should generate date range for YESTERDAY preset', () => {
      const range = dateUtils.getDateRangeFromPreset(DateRangePreset.YESTERDAY);
      expect(range.startDate).toBe('2023-01-14');
      expect(range.endDate).toBe('2023-01-14');
    });

    it('should generate date range for THIS_MONTH preset', () => {
      const range = dateUtils.getDateRangeFromPreset(DateRangePreset.THIS_MONTH);
      expect(range.startDate).toBe('2023-01-01');
      expect(range.endDate).toBe('2023-01-31');
    });

    it('should generate date range for LAST_30_DAYS preset', () => {
      const range = dateUtils.getDateRangeFromPreset(DateRangePreset.LAST_30_DAYS);
      expect(range.startDate).toBe('2022-12-17');
      expect(range.endDate).toBe('2023-01-15');
    });

    it('should throw error for unrecognized preset', () => {
      expect(() => dateUtils.getDateRangeFromPreset('INVALID_PRESET' as DateRangePreset))
        .toThrow(ValidationError);
    });
  });

  describe('getStartOfPeriod and getEndOfPeriod', () => {
    it('should get start of day', () => {
      const date = new Date(2023, 0, 15, 14, 30, 45); // Jan 15, 2023, 14:30:45
      const result = dateUtils.getStartOfPeriod(date, TimeInterval.DAILY);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should get end of day', () => {
      const date = new Date(2023, 0, 15, 14, 30, 45); // Jan 15, 2023, 14:30:45
      const result = dateUtils.getEndOfPeriod(date, TimeInterval.DAILY);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });

    it('should get start of month', () => {
      const date = new Date(2023, 0, 15);
      const result = dateUtils.getStartOfPeriod(date, TimeInterval.MONTHLY);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('should get end of month', () => {
      const date = new Date(2023, 0, 15);
      const result = dateUtils.getEndOfPeriod(date, TimeInterval.MONTHLY);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(31);
    });

    it('should handle string and timestamp inputs', () => {
      const startResult = dateUtils.getStartOfPeriod('2023-01-15', TimeInterval.DAILY);
      expect(startResult.getDate()).toBe(15);
      expect(startResult.getHours()).toBe(0);
      
      const timestamp = new Date(2023, 0, 15).getTime();
      const endResult = dateUtils.getEndOfPeriod(timestamp, TimeInterval.DAILY);
      expect(endResult.getDate()).toBe(15);
      expect(endResult.getHours()).toBe(23);
    });

    it('should throw error for invalid dates', () => {
      expect(() => dateUtils.getStartOfPeriod('invalid', TimeInterval.DAILY)).toThrow(ValidationError);
      expect(() => dateUtils.getEndOfPeriod('invalid', TimeInterval.DAILY)).toThrow(ValidationError);
    });

    it('should throw error for unrecognized interval', () => {
      expect(() => dateUtils.getStartOfPeriod(new Date(), 'INVALID' as TimeInterval))
        .toThrow(ValidationError);
      expect(() => dateUtils.getEndOfPeriod(new Date(), 'INVALID' as TimeInterval))
        .toThrow(ValidationError);
    });
  });

  describe('compareDates', () => {
    it('should return -1 when first date is before second', () => {
      expect(dateUtils.compareDates(new Date(2023, 0, 1), new Date(2023, 0, 2))).toBe(-1);
      expect(dateUtils.compareDates('2023-01-01', '2023-01-02')).toBe(-1);
    });

    it('should return 0 when dates are the same day', () => {
      expect(dateUtils.compareDates(new Date(2023, 0, 1), new Date(2023, 0, 1))).toBe(0);
      expect(dateUtils.compareDates('2023-01-01', '2023-01-01')).toBe(0);
      
      // Different times on same day should still return 0
      expect(dateUtils.compareDates(
        new Date(2023, 0, 1, 9, 0),
        new Date(2023, 0, 1, 17, 0)
      )).toBe(0);
    });

    it('should return 1 when first date is after second', () => {
      expect(dateUtils.compareDates(new Date(2023, 0, 2), new Date(2023, 0, 1))).toBe(1);
      expect(dateUtils.compareDates('2023-01-02', '2023-01-01')).toBe(1);
    });

    it('should handle string and timestamp inputs', () => {
      expect(dateUtils.compareDates('2023-01-01', new Date(2023, 0, 2))).toBe(-1);
      
      const timestamp1 = new Date(2023, 0, 1).getTime();
      const timestamp2 = new Date(2023, 0, 2).getTime();
      expect(dateUtils.compareDates(timestamp1, timestamp2)).toBe(-1);
    });

    it('should throw error for invalid dates', () => {
      expect(() => dateUtils.compareDates('invalid', '2023-01-01')).toThrow(ValidationError);
      expect(() => dateUtils.compareDates('2023-01-01', 'invalid')).toThrow(ValidationError);
    });
  });

  describe('isDateInRange', () => {
    it('should return true when date is within range (inclusive)', () => {
      const range = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      expect(dateUtils.isDateInRange(new Date(2023, 0, 1), range)).toBe(true);
      expect(dateUtils.isDateInRange(new Date(2023, 0, 15), range)).toBe(true);
      expect(dateUtils.isDateInRange(new Date(2023, 0, 31), range)).toBe(true);
    });

    it('should return false when date is outside range', () => {
      const range = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      expect(dateUtils.isDateInRange(new Date(2022, 11, 31), range)).toBe(false); // Dec 31, 2022
      expect(dateUtils.isDateInRange(new Date(2023, 1, 1), range)).toBe(false); // Feb 1, 2023
    });

    it('should handle inclusive/exclusive option', () => {
      const range = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      // With inclusive=false, boundary dates should be excluded
      expect(dateUtils.isDateInRange(new Date(2023, 0, 1), range, false)).toBe(false);
      expect(dateUtils.isDateInRange(new Date(2023, 0, 15), range, false)).toBe(true);
      expect(dateUtils.isDateInRange(new Date(2023, 0, 31), range, false)).toBe(false);
    });

    it('should handle string and timestamp inputs', () => {
      const range = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      expect(dateUtils.isDateInRange('2023-01-15', range)).toBe(true);
      
      const timestamp = new Date(2023, 0, 15).getTime();
      expect(dateUtils.isDateInRange(timestamp, range)).toBe(true);
    });

    it('should throw error for invalid dates', () => {
      const range = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      expect(() => dateUtils.isDateInRange('invalid', range)).toThrow(ValidationError);
      
      const invalidRange = {
        startDate: 'invalid',
        endDate: '2023-01-31'
      };
      
      expect(() => dateUtils.isDateInRange('2023-01-15', invalidRange)).toThrow(ValidationError);
    });
  });

  describe('getAgeBucketFromDays', () => {
    it('should categorize days into appropriate buckets', () => {
      expect(dateUtils.getAgeBucketFromDays(-5)).toBe('Current');
      expect(dateUtils.getAgeBucketFromDays(0)).toBe('0-30');
      expect(dateUtils.getAgeBucketFromDays(15)).toBe('0-30');
      expect(dateUtils.getAgeBucketFromDays(30)).toBe('0-30');
      expect(dateUtils.getAgeBucketFromDays(31)).toBe('31-60');
      expect(dateUtils.getAgeBucketFromDays(60)).toBe('31-60');
      expect(dateUtils.getAgeBucketFromDays(61)).toBe('61-90');
      expect(dateUtils.getAgeBucketFromDays(90)).toBe('61-90');
      expect(dateUtils.getAgeBucketFromDays(91)).toBe('91+');
      expect(dateUtils.getAgeBucketFromDays(120)).toBe('91+');
    });
  });

  describe('getCurrentFiscalYear', () => {
    // Mock current date for consistent testing
    let originalDate: any;
    beforeEach(() => {
      originalDate = global.Date;
      const mockDate = new Date(2023, 4, 15); // May 15, 2023
      // @ts-ignore
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      };
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should calculate fiscal year with default start month (January)', () => {
      const result = dateUtils.getCurrentFiscalYear();
      
      expect(result.year).toBe(2023);
      
      expect(result.startDate.getFullYear()).toBe(2023);
      expect(result.startDate.getMonth()).toBe(0); // January
      expect(result.startDate.getDate()).toBe(1);
      
      expect(result.endDate.getFullYear()).toBe(2023);
      expect(result.endDate.getMonth()).toBe(11); // December
      expect(result.endDate.getDate()).toBe(31);
    });

    it('should calculate fiscal year with custom start month', () => {
      // With fiscal year starting in July (7)
      const result = dateUtils.getCurrentFiscalYear(7);
      
      // May 2023 is in fiscal year 2022 (July 2022 - June 2023)
      expect(result.year).toBe(2022);
      
      expect(result.startDate.getFullYear()).toBe(2022);
      expect(result.startDate.getMonth()).toBe(6); // July
      expect(result.startDate.getDate()).toBe(1);
      
      expect(result.endDate.getFullYear()).toBe(2023);
      expect(result.endDate.getMonth()).toBe(5); // June
      expect(result.endDate.getDate()).toBe(30);
    });

    it('should handle invalid start months by clamping to valid range', () => {
      // Less than 1 should be treated as 1 (January)
      const resultLow = dateUtils.getCurrentFiscalYear(0);
      expect(resultLow.startDate.getMonth()).toBe(0); // January
      
      // Greater than 12 should be treated as 12 (December)
      const resultHigh = dateUtils.getCurrentFiscalYear(13);
      expect(resultHigh.startDate.getMonth()).toBe(11); // December
    });
  });

  describe('getDatePeriods', () => {
    it('should generate monthly periods within date range', () => {
      const range = {
        startDate: '2023-01-15',
        endDate: '2023-03-15'
      };
      
      const periods = dateUtils.getDatePeriods(range, TimeInterval.MONTHLY);
      
      expect(periods.length).toBe(3);
      
      expect(periods[0].label).toBe('Jan 2023');
      expect(periods[0].startDate.getMonth()).toBe(0); // January
      
      expect(periods[1].label).toBe('Feb 2023');
      expect(periods[1].startDate.getMonth()).toBe(1); // February
      
      expect(periods[2].label).toBe('Mar 2023');
      expect(periods[2].startDate.getMonth()).toBe(2); // March
    });

    it('should generate quarterly periods within date range', () => {
      const range = {
        startDate: '2023-01-15',
        endDate: '2023-09-15'
      };
      
      const periods = dateUtils.getDatePeriods(range, TimeInterval.QUARTERLY);
      
      expect(periods.length).toBe(3);
      
      expect(periods[0].label).toBe('Q1 2023');
      expect(periods[0].startDate.getMonth()).toBe(0); // January (Q1)
      
      expect(periods[1].label).toBe('Q2 2023');
      expect(periods[1].startDate.getMonth()).toBe(3); // April (Q2)
      
      expect(periods[2].label).toBe('Q3 2023');
      expect(periods[2].startDate.getMonth()).toBe(6); // July (Q3)
    });

    it('should throw error for invalid dates', () => {
      const invalidRange = {
        startDate: 'invalid',
        endDate: '2023-03-15'
      };
      
      expect(() => dateUtils.getDatePeriods(invalidRange, TimeInterval.MONTHLY))
        .toThrow(ValidationError);
    });
  });

  describe('formatDateForDatabase', () => {
    it('should format dates as ISO strings for database storage', () => {
      const date = new Date(2023, 0, 15);
      const result = dateUtils.formatDateForDatabase(date);
      
      // Should be in ISO format, but exact string depends on timezone
      expect(result).toContain('2023-01-15');
      expect(result).toContain('T');
      expect(result).toContain('Z');
    });

    it('should handle string and timestamp inputs', () => {
      const stringResult = dateUtils.formatDateForDatabase('2023-01-15');
      expect(stringResult).toContain('2023-01-15');
      
      const timestamp = new Date(2023, 0, 15).getTime();
      const timestampResult = dateUtils.formatDateForDatabase(timestamp);
      expect(timestampResult).toContain('2023-01-15');
    });

    it('should return null for invalid inputs', () => {
      expect(dateUtils.formatDateForDatabase(null)).toBeNull();
      expect(dateUtils.formatDateForDatabase(undefined)).toBeNull();
      expect(dateUtils.formatDateForDatabase('invalid-date')).toBeNull();
      expect(dateUtils.formatDateForDatabase(new Date('invalid'))).toBeNull();
    });
  });

  describe('Default constants', () => {
    it('should have correct date format constants', () => {
      expect(dateUtils.DEFAULT_DATE_FORMAT).toBe('yyyy-MM-dd');
      expect(dateUtils.DEFAULT_DISPLAY_DATE_FORMAT).toBe('MM/dd/yyyy');
      expect(dateUtils.DEFAULT_DATETIME_FORMAT).toBe('yyyy-MM-dd HH:mm:ss');
      expect(dateUtils.DEFAULT_DISPLAY_DATETIME_FORMAT).toBe('MM/dd/yyyy h:mm a');
    });
  });
});

describe('Math Utilities', () => {
  describe('roundToDecimal', () => {
    it('should round numbers to the specified number of decimal places', () => {
      expect(mathUtils.roundToDecimal(1.2345, 2)).toBe(1.23);
      expect(mathUtils.roundToDecimal(1.2356, 2)).toBe(1.24);
      expect(mathUtils.roundToDecimal(1.2345, 3)).toBe(1.235);
      expect(mathUtils.roundToDecimal(1.2345)).toBe(1.23); // Default 2 decimal places
    });

    it('should handle integer inputs', () => {
      expect(mathUtils.roundToDecimal(5, 2)).toBe(5);
      expect(mathUtils.roundToDecimal(0, 2)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(mathUtils.roundToDecimal(-1.2345, 2)).toBe(-1.23);
      expect(mathUtils.roundToDecimal(-1.2356, 2)).toBe(-1.24);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.roundToDecimal(NaN)).toBe(0);
      expect(mathUtils.roundToDecimal(null as any)).toBe(0);
      expect(mathUtils.roundToDecimal(undefined as any)).toBe(0);
    });
  });

  describe('roundCurrency', () => {
    it('should round monetary values to 2 decimal places', () => {
      expect(mathUtils.roundCurrency(1.2345)).toBe(1.23);
      expect(mathUtils.roundCurrency(1.2356)).toBe(1.24);
      expect(mathUtils.roundCurrency(1)).toBe(1);
    });

    it('should handle negative monetary values', () => {
      expect(mathUtils.roundCurrency(-1.2345)).toBe(-1.23);
      expect(mathUtils.roundCurrency(-1.2356)).toBe(-1.24);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.roundCurrency(NaN)).toBe(0);
      expect(mathUtils.roundCurrency(null as any)).toBe(0);
      expect(mathUtils.roundCurrency(undefined as any)).toBe(0);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(mathUtils.calculatePercentage(25, 100)).toBe(25);
      expect(mathUtils.calculatePercentage(50, 200)).toBe(25);
      expect(mathUtils.calculatePercentage(150, 100)).toBe(150);
    });

    it('should round to specified decimal places', () => {
      expect(mathUtils.calculatePercentage(1, 3)).toBeCloseTo(33.33);
      expect(mathUtils.calculatePercentage(2, 3)).toBeCloseTo(66.67);
    });

    it('should return 0 when whole is 0 or close to 0', () => {
      expect(mathUtils.calculatePercentage(5, 0)).toBe(0);
      expect(mathUtils.calculatePercentage(5, 0.0000001)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.calculatePercentage(NaN, 100)).toBe(0);
      expect(mathUtils.calculatePercentage(50, NaN)).toBe(0);
      expect(mathUtils.calculatePercentage(null as any, 100)).toBe(0);
      expect(mathUtils.calculatePercentage(50, null as any)).toBe(0);
      expect(mathUtils.calculatePercentage(undefined as any, 100)).toBe(0);
      expect(mathUtils.calculatePercentage(50, undefined as any)).toBe(0);
    });
  });

  describe('calculateChange', () => {
    it('should calculate percentage change correctly', () => {
      expect(mathUtils.calculateChange(125, 100)).toBe(25);
      expect(mathUtils.calculateChange(75, 100)).toBe(-25);
      expect(mathUtils.calculateChange(200, 100)).toBe(100);
    });

    it('should handle special cases when previous value is 0', () => {
      expect(mathUtils.calculateChange(100, 0)).toBe(100);
      expect(mathUtils.calculateChange(-100, 0)).toBe(-100);
      expect(mathUtils.calculateChange(0, 0)).toBe(0);
    });

    it('should round to specified decimal places', () => {
      expect(mathUtils.calculateChange(110, 100)).toBe(10);
      expect(mathUtils.calculateChange(133, 100)).toBe(33);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.calculateChange(NaN, 100)).toBe(0);
      expect(mathUtils.calculateChange(150, NaN)).toBe(0);
      expect(mathUtils.calculateChange(null as any, 100)).toBe(0);
      expect(mathUtils.calculateChange(150, null as any)).toBe(0);
      expect(mathUtils.calculateChange(undefined as any, 100)).toBe(0);
      expect(mathUtils.calculateChange(150, undefined as any)).toBe(0);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      expect(mathUtils.calculateAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(mathUtils.calculateAverage([10, 20, 30])).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(mathUtils.calculateAverage([])).toBe(0);
    });

    it('should filter out non-numeric values', () => {
      expect(mathUtils.calculateAverage([1, 2, null as any, 4, undefined as any])).toBe(2.33);
      expect(mathUtils.calculateAverage([1, 2, NaN, 4])).toBe(2.33);
    });

    it('should return 0 if all values are invalid', () => {
      expect(mathUtils.calculateAverage([null as any, undefined as any, NaN])).toBe(0);
    });
  });

  describe('calculateMedian', () => {
    it('should calculate median for odd-length arrays', () => {
      expect(mathUtils.calculateMedian([1, 3, 2])).toBe(2);
      expect(mathUtils.calculateMedian([5, 2, 8, 1, 7])).toBe(5);
    });

    it('should calculate median for even-length arrays', () => {
      expect(mathUtils.calculateMedian([1, 2, 3, 4])).toBe(2.5);
      expect(mathUtils.calculateMedian([5, 2, 8, 1])).toBe(3.5);
    });

    it('should return 0 for empty array', () => {
      expect(mathUtils.calculateMedian([])).toBe(0);
    });

    it('should filter out non-numeric values', () => {
      expect(mathUtils.calculateMedian([1, 2, null as any, 4, undefined as any])).toBe(2);
      expect(mathUtils.calculateMedian([1, 2, NaN, 4])).toBe(2);
    });

    it('should return 0 if all values are invalid', () => {
      expect(mathUtils.calculateMedian([null as any, undefined as any, NaN])).toBe(0);
    });
  });

  describe('calculateSum', () => {
    it('should calculate sum correctly', () => {
      expect(mathUtils.calculateSum([1, 2, 3, 4, 5])).toBe(15);
      expect(mathUtils.calculateSum([10, 20, 30])).toBe(60);
    });

    it('should return 0 for empty array', () => {
      expect(mathUtils.calculateSum([])).toBe(0);
    });

    it('should filter out non-numeric values', () => {
      expect(mathUtils.calculateSum([1, 2, null as any, 4, undefined as any])).toBe(7);
      expect(mathUtils.calculateSum([1, 2, NaN, 4])).toBe(7);
    });

    it('should return 0 if all values are invalid', () => {
      expect(mathUtils.calculateSum([null as any, undefined as any, NaN])).toBe(0);
    });
  });

  describe('calculateWeightedAverage', () => {
    it('should calculate weighted average correctly', () => {
      expect(mathUtils.calculateWeightedAverage([10, 20, 30], [1, 2, 3])).toBe(23.33);
      expect(mathUtils.calculateWeightedAverage([20, 50], [3, 1])).toBe(27.5);
    });

    it('should throw error if arrays have different lengths', () => {
      expect(() => mathUtils.calculateWeightedAverage([10, 20], [1, 2, 3])).toThrow();
      expect(() => mathUtils.calculateWeightedAverage([10, 20, 30], [1, 2])).toThrow();
    });

    it('should return 0 for empty arrays', () => {
      expect(mathUtils.calculateWeightedAverage([], [])).toBe(0);
    });

    it('should filter out pairs with non-numeric values', () => {
      expect(mathUtils.calculateWeightedAverage(
        [10, 20, null as any, 40],
        [1, 2, 3, 4]
      )).toBe(30);
      
      expect(mathUtils.calculateWeightedAverage(
        [10, 20, 30, 40],
        [1, 2, null as any, 4]
      )).toBe(30);
    });

    it('should return 0 if sum of weights is 0', () => {
      expect(mathUtils.calculateWeightedAverage([10, 20], [0, 0])).toBe(0);
    });
  });

  describe('isWithinTolerance', () => {
    it('should return true when values are within tolerance', () => {
      expect(mathUtils.isWithinTolerance(1.0001, 1.0002, 0.001)).toBe(true);
      expect(mathUtils.isWithinTolerance(100, 100.05, 0.1)).toBe(true);
    });

    it('should return false when values exceed tolerance', () => {
      expect(mathUtils.isWithinTolerance(1.0, 1.01, 0.001)).toBe(false);
      expect(mathUtils.isWithinTolerance(100, 101, 0.5)).toBe(false);
    });

    it('should use default epsilon tolerance when not specified', () => {
      expect(mathUtils.isWithinTolerance(1.0, 1.0 + 1e-7)).toBe(true);
      expect(mathUtils.isWithinTolerance(1.0, 1.0 + 1e-5)).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(mathUtils.isWithinTolerance(NaN, 1)).toBe(false);
      expect(mathUtils.isWithinTolerance(1, NaN)).toBe(false);
      expect(mathUtils.isWithinTolerance(null as any, 1)).toBe(false);
      expect(mathUtils.isWithinTolerance(1, null as any)).toBe(false);
      expect(mathUtils.isWithinTolerance(undefined as any, 1)).toBe(false);
      expect(mathUtils.isWithinTolerance(1, undefined as any)).toBe(false);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(mathUtils.clamp(5, 1, 10)).toBe(5);
      expect(mathUtils.clamp(5.5, 5, 6)).toBe(5.5);
    });

    it('should return min when value is below range', () => {
      expect(mathUtils.clamp(0, 1, 10)).toBe(1);
      expect(mathUtils.clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above range', () => {
      expect(mathUtils.clamp(11, 1, 10)).toBe(10);
      expect(mathUtils.clamp(100, 0, 10)).toBe(10);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.clamp(NaN, 1, 10)).toBe(0);
      expect(mathUtils.clamp(5, NaN, 10)).toBe(0);
      expect(mathUtils.clamp(5, 1, NaN)).toBe(0);
      expect(mathUtils.clamp(null as any, 1, 10)).toBe(0);
    });
  });

  describe('calculateDSO', () => {
    it('should calculate Days Sales Outstanding correctly', () => {
      expect(mathUtils.calculateDSO(100000, 2000)).toBe(50);
      expect(mathUtils.calculateDSO(50000, 1000)).toBe(50);
    });

    it('should round to nearest whole number', () => {
      expect(mathUtils.calculateDSO(100000, 1900)).toBe(53); // 52.63 rounded
      expect(mathUtils.calculateDSO(100000, 2100)).toBe(48); // 47.62 rounded
    });

    it('should return 0 when average daily revenue is 0 or close to 0', () => {
      expect(mathUtils.calculateDSO(100000, 0)).toBe(0);
      expect(mathUtils.calculateDSO(100000, 0.0000001)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.calculateDSO(NaN, 1000)).toBe(0);
      expect(mathUtils.calculateDSO(100000, NaN)).toBe(0);
      expect(mathUtils.calculateDSO(null as any, 1000)).toBe(0);
      expect(mathUtils.calculateDSO(100000, null as any)).toBe(0);
    });
  });

  describe('calculateCollectionRate', () => {
    it('should calculate collection rate correctly', () => {
      expect(mathUtils.calculateCollectionRate(80000, 100000)).toBe(80);
      expect(mathUtils.calculateCollectionRate(50000, 50000)).toBe(100);
      expect(mathUtils.calculateCollectionRate(120000, 100000)).toBe(120);
    });

    it('should round to specified decimal places', () => {
      expect(mathUtils.calculateCollectionRate(1234, 10000)).toBeCloseTo(12.34);
    });

    it('should return 0 when expected payments is 0 or close to 0', () => {
      expect(mathUtils.calculateCollectionRate(10000, 0)).toBe(0);
      expect(mathUtils.calculateCollectionRate(10000, 0.0000001)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.calculateCollectionRate(NaN, 100000)).toBe(0);
      expect(mathUtils.calculateCollectionRate(80000, NaN)).toBe(0);
      expect(mathUtils.calculateCollectionRate(null as any, 100000)).toBe(0);
      expect(mathUtils.calculateCollectionRate(80000, null as any)).toBe(0);
    });
  });

  describe('calculateCleanClaimRate', () => {
    it('should calculate clean claim rate correctly', () => {
      expect(mathUtils.calculateCleanClaimRate(100, 20)).toBe(80);
      expect(mathUtils.calculateCleanClaimRate(100, 0)).toBe(100);
      expect(mathUtils.calculateCleanClaimRate(100, 100)).toBe(0);
    });

    it('should round to specified decimal places', () => {
      expect(mathUtils.calculateCleanClaimRate(1000, 123)).toBeCloseTo(87.7);
    });

    it('should return 0 when total claims is 0', () => {
      expect(mathUtils.calculateCleanClaimRate(0, 0)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.calculateCleanClaimRate(NaN, 20)).toBe(0);
      expect(mathUtils.calculateCleanClaimRate(100, NaN)).toBe(0);
      expect(mathUtils.calculateCleanClaimRate(null as any, 20)).toBe(0);
      expect(mathUtils.calculateCleanClaimRate(100, null as any)).toBe(0);
    });
  });

  describe('calculateDenialRate', () => {
    it('should calculate denial rate correctly', () => {
      expect(mathUtils.calculateDenialRate(20, 100)).toBe(20);
      expect(mathUtils.calculateDenialRate(0, 100)).toBe(0);
      expect(mathUtils.calculateDenialRate(100, 100)).toBe(100);
    });

    it('should round to specified decimal places', () => {
      expect(mathUtils.calculateDenialRate(123, 1000)).toBeCloseTo(12.3);
    });

    it('should return 0 when total claims is 0', () => {
      expect(mathUtils.calculateDenialRate(0, 0)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(mathUtils.calculateDenialRate(NaN, 100)).toBe(0);
      expect(mathUtils.calculateDenialRate(20, NaN)).toBe(0);
      expect(mathUtils.calculateDenialRate(null as any, 100)).toBe(0);
      expect(mathUtils.calculateDenialRate(20, null as any)).toBe(0);
    });
  });

  describe('calculateLinearRegression', () => {
    it('should calculate linear regression parameters correctly', () => {
      const xValues = [1, 2, 3, 4, 5];
      const yValues = [2, 4, 6, 8, 10];
      
      const result = mathUtils.calculateLinearRegression(xValues, yValues);
      
      expect(result.slope).toBe(2);
      expect(result.intercept).toBe(0);
      expect(result.r2).toBe(1); // Perfect correlation
    });

    it('should calculate regression with noise', () => {
      const xValues = [1, 2, 3, 4, 5];
      const yValues = [2.1, 3.9, 6.2, 7.8, 10.1]; // Slightly noisy data
      
      const result = mathUtils.calculateLinearRegression(xValues, yValues);
      
      expect(result.slope).toBeCloseTo(2);
      expect(result.intercept).toBeCloseTo(0, 0);
      expect(result.r2).toBeGreaterThan(0.99); // Strong but not perfect correlation
    });

    it('should throw error for invalid inputs', () => {
      expect(() => mathUtils.calculateLinearRegression(null as any, [1, 2])).toThrow();
      expect(() => mathUtils.calculateLinearRegression([1, 2], null as any)).toThrow();
      expect(() => mathUtils.calculateLinearRegression([], [1, 2])).toThrow();
      expect(() => mathUtils.calculateLinearRegression([1, 2], [1])).toThrow();
    });

    it('should handle arrays with non-numeric values', () => {
      const xValues = [1, 2, null as any, 4, 5];
      const yValues = [2, 4, 6, null as any, 10];
      
      const result = mathUtils.calculateLinearRegression(xValues, yValues);
      
      // Should use only valid pairs: [1,2] and [2,4] and [5,10]
      expect(result.slope).toBeCloseTo(2);
    });

    it('should return zeros for insufficient data', () => {
      const xValues = [1];
      const yValues = [2];
      
      const result = mathUtils.calculateLinearRegression(xValues, yValues);
      
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.r2).toBe(0);
    });
  });

  describe('calculateTrend', () => {
    it('should calculate trend line for values', () => {
      const values = [2, 4, 6, 8, 10]; // Linear trend with slope 2
      const trend = mathUtils.calculateTrend(values);
      
      // Trend should be a straight line matching the input (perfect correlation)
      expect(trend.length).toBe(5);
      expect(trend[0]).toBeCloseTo(2);
      expect(trend[4]).toBeCloseTo(10);
    });

    it('should calculate trend for noisy data', () => {
      const values = [2.1, 3.9, 6.2, 7.8, 10.1]; // Slightly noisy data
      const trend = mathUtils.calculateTrend(values);
      
      // Trend should approximate the underlying linear pattern
      expect(trend.length).toBe(5);
      expect(trend[0]).toBeCloseTo(2, 0);
      expect(trend[4]).toBeCloseTo(10, 0);
    });

    it('should return original array for inputs with fewer than 2 values', () => {
      expect(mathUtils.calculateTrend([5])).toEqual([5]);
      expect(mathUtils.calculateTrend([])).toEqual([]);
    });

    it('should handle non-array inputs', () => {
      expect(mathUtils.calculateTrend(null as any)).toEqual([]);
      expect(mathUtils.calculateTrend(undefined as any)).toEqual([]);
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average with specified window size', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const windowSize = 3;
      
      const result = mathUtils.calculateMovingAverage(values, windowSize);
      
      expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
      // First result: (1+2+3)/3 = 2
      // Last result: (8+9+10)/3 = 9
    });

    it('should handle window size larger than array length', () => {
      const values = [1, 2, 3];
      const windowSize = 5;
      
      const result = mathUtils.calculateMovingAverage(values, windowSize);
      
      // Should return cumulative averages
      expect(result).toEqual([1, 1.5, 2]);
      // [1]/1, [1+2]/2, [1+2+3]/3
    });

    it('should throw error for invalid window size', () => {
      expect(() => mathUtils.calculateMovingAverage([1, 2, 3], 0)).toThrow();
      expect(() => mathUtils.calculateMovingAverage([1, 2, 3], -1)).toThrow();
      expect(() => mathUtils.calculateMovingAverage([1, 2, 3], 1.5)).toThrow();
    });

    it('should return empty array for empty input', () => {
      expect(mathUtils.calculateMovingAverage([], 3)).toEqual([]);
    });

    it('should handle non-array inputs', () => {
      expect(mathUtils.calculateMovingAverage(null as any, 3)).toEqual([]);
      expect(mathUtils.calculateMovingAverage(undefined as any, 3)).toEqual([]);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      expect(mathUtils.calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.14, 1);
      expect(mathUtils.calculateStandardDeviation([1, 1, 1, 1])).toBe(0); // No variation
    });

    it('should return 0 for arrays with fewer than 2 values', () => {
      expect(mathUtils.calculateStandardDeviation([5])).toBe(0);
      expect(mathUtils.calculateStandardDeviation([])).toBe(0);
    });

    it('should filter out non-numeric values', () => {
      expect(mathUtils.calculateStandardDeviation([2, 4, null as any, 4, undefined as any, 5, NaN, 9]))
        .toBeCloseTo(2.58, 1);
    });

    it('should return 0 if all values are invalid', () => {
      expect(mathUtils.calculateStandardDeviation([null as any, undefined as any, NaN])).toBe(0);
    });
  });

  describe('calculatePaymentReconciliationDifference', () => {
    it('should calculate difference between payment and allocated amounts', () => {
      expect(mathUtils.calculatePaymentReconciliationDifference(1000, [400, 300, 200])).toBe(100);
      expect(mathUtils.calculatePaymentReconciliationDifference(1000, [500, 500])).toBe(0);
      expect(mathUtils.calculatePaymentReconciliationDifference(1000, [1100])).toBe(-100);
    });

    it('should round to currency precision', () => {
      expect(mathUtils.calculatePaymentReconciliationDifference(1000.55, [600.33, 400.11])).toBe(0.11);
    });

    it('should return payment amount for empty allocated amounts', () => {
      expect(mathUtils.calculatePaymentReconciliationDifference(1000, [])).toBe(1000);
    });

    it('should return payment amount for null or undefined allocated amounts', () => {
      expect(mathUtils.calculatePaymentReconciliationDifference(1000, null as any)).toBe(1000);
      expect(mathUtils.calculatePaymentReconciliationDifference(1000, undefined as any)).toBe(1000);
    });

    it('should return 0 for invalid payment amount', () => {
      expect(mathUtils.calculatePaymentReconciliationDifference(NaN, [400, 300])).toBe(0);
      expect(mathUtils.calculatePaymentReconciliationDifference(null as any, [400, 300])).toBe(0);
      expect(mathUtils.calculatePaymentReconciliationDifference(undefined as any, [400, 300])).toBe(0);
    });
  });
});