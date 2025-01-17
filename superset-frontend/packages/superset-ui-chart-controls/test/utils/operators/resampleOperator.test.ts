/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { AdhocColumn, QueryObject, SqlaFormData } from '@superset-ui/core';
import { resampleOperator } from '@superset-ui/chart-controls';

const formData: SqlaFormData = {
  metrics: [
    'count(*)',
    { label: 'sum(val)', expressionType: 'SQL', sqlExpression: 'sum(val)' },
  ],
  time_range: '2015 : 2016',
  granularity: 'month',
  datasource: 'foo',
  viz_type: 'table',
};
const queryObject: QueryObject = {
  metrics: [
    'count(*)',
    { label: 'sum(val)', expressionType: 'SQL', sqlExpression: 'sum(val)' },
  ],
  time_range: '2015 : 2016',
  granularity: 'month',
  post_processing: [
    {
      operation: 'pivot',
      options: {
        index: ['__timestamp'],
        columns: ['nation'],
        aggregates: {
          'count(*)': {
            operator: 'sum',
          },
        },
      },
    },
  ],
};

test('should skip resampleOperator', () => {
  expect(resampleOperator(formData, queryObject)).toEqual(undefined);
  expect(
    resampleOperator({ ...formData, resample_method: 'ffill' }, queryObject),
  ).toEqual(undefined);
  expect(
    resampleOperator({ ...formData, resample_rule: '1D' }, queryObject),
  ).toEqual(undefined);
});

test('should do resample', () => {
  expect(
    resampleOperator(
      { ...formData, resample_method: 'ffill', resample_rule: '1D' },
      queryObject,
    ),
  ).toEqual({
    operation: 'resample',
    options: {
      method: 'ffill',
      rule: '1D',
      fill_value: null,
      time_column: '__timestamp',
      groupby_columns: [],
    },
  });
});

test('should do zerofill resample', () => {
  expect(
    resampleOperator(
      { ...formData, resample_method: 'zerofill', resample_rule: '1D' },
      queryObject,
    ),
  ).toEqual({
    operation: 'resample',
    options: {
      method: 'asfreq',
      rule: '1D',
      fill_value: 0,
      time_column: '__timestamp',
      groupby_columns: [],
    },
  });
});

test('should append physical column to resample', () => {
  expect(
    resampleOperator(
      { ...formData, resample_method: 'zerofill', resample_rule: '1D' },
      { ...queryObject, columns: ['column1', 'column2'] },
    ),
  ).toEqual({
    operation: 'resample',
    options: {
      method: 'asfreq',
      rule: '1D',
      fill_value: 0,
      time_column: '__timestamp',
      groupby_columns: ['column1', 'column2'],
    },
  });
});

test('should append label of adhoc column and physical column to resample', () => {
  expect(
    resampleOperator(
      { ...formData, resample_method: 'zerofill', resample_rule: '1D' },
      {
        ...queryObject,
        columns: [
          {
            hasCustomLabel: true,
            label: 'concat_a_b',
            expressionType: 'SQL',
            sqlExpression: "'a' + 'b'",
          } as AdhocColumn,
          'column2',
        ],
      },
    ),
  ).toEqual({
    operation: 'resample',
    options: {
      method: 'asfreq',
      rule: '1D',
      fill_value: 0,
      time_column: '__timestamp',
      groupby_columns: ['concat_a_b', 'column2'],
    },
  });
});

test('should append `undefined` if adhoc non-existing label', () => {
  expect(
    resampleOperator(
      { ...formData, resample_method: 'zerofill', resample_rule: '1D' },
      {
        ...queryObject,
        columns: [
          {
            sqlExpression: "'a' + 'b'",
          } as AdhocColumn,
          'column2',
        ],
      },
    ),
  ).toEqual({
    operation: 'resample',
    options: {
      method: 'asfreq',
      rule: '1D',
      fill_value: 0,
      time_column: '__timestamp',
      groupby_columns: [undefined, 'column2'],
    },
  });
});
