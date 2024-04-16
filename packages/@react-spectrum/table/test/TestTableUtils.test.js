/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, pointerMap, render, screen} from '@react-spectrum/test-utils-internal';
import {Cell, Column, Row, TableBody, TableHeader, TableView} from '../';
import {Provider} from '@react-spectrum/provider';
import React, {useState} from 'react';
import {theme} from '@react-spectrum/theme-default';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let manyItems = [];
for (let i = 1; i <= 100; i++) {
  manyItems.push({id: i, foo: 'Foo ' + i, bar: 'Bar ' + i, baz: 'Baz ' + i});
}

let columns = [
  {name: 'Foo', key: 'foo'},
  {name: 'Bar', key: 'bar'},
  {name: 'Baz', key: 'baz'}
];

describe('Table ', function () {
  let offsetWidth, offsetHeight;
  let onSelectionChange = jest.fn();
  let onSortChange = jest.fn();
  // let user;
  let tableUtil;

  let TableExample = (props) => {
    let [sort, setSort] = useState({});
    let setSortDescriptor = (sort) => {
      setSort(sort);
      onSortChange(sort);
    };

    return (
      <Provider theme={theme}>
        <TableView aria-label="Table" selectionMode="multiple" data-testid="test" sortDescriptor={sort} onSortChange={setSortDescriptor} onSelectionChange={onSelectionChange} {...props}>
          <TableHeader columns={columns}>
            {column => <Column allowsSorting allowsResizing={props.allowsResizing}>{column.name}</Column>}
          </TableHeader>
          <TableBody items={manyItems}>
            {item =>
              (<Row key={item.foo}>
                {key => <Cell>{item[key]}</Cell>}
              </Row>)
            }
          </TableBody>
        </TableView>
      </Provider>
    );
  };

  beforeAll(function () {
    tableUtil = new User().table;
    // user = userEvent.setup({delay: null, pointerMap});
    // offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    // offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
  });

  afterAll(function () {
    // offsetWidth.mockReset();
    // offsetHeight.mockReset();
  });

  describe('with real timers', function () {
    beforeAll(function () {
      jest.useRealTimers();
    });

    afterEach(function () {
      jest.clearAllMocks();
    });

    it('basic flow with TableTester', async function () {
      render(<TableExample />);

      tableUtil.setTable(screen.getByTestId('test'));
      await tableUtil.toggleRowSelection({index: 2});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Foo 3']));

      await tableUtil.toggleRowSelection({text: 'Foo 4'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['Foo 3', 'Foo 4']));

      await tableUtil.toggleSelectAll();
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect((onSelectionChange.mock.calls[2][0])).toEqual('all');

      await tableUtil.toggleSort({index: 2});
      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'bar', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(2);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(3);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'descending'});
    });


    it('basic flow with TableTester (testing menu sort change and highlight selection)', async function () {
      render(<TableExample allowsResizing selectionStyle="highlight" />);

      tableUtil.setTable(screen.getByTestId('test'));
      await tableUtil.toggleRowSelection({index: 2});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Foo 3']));

      await tableUtil.toggleRowSelection({text: 'Foo 4'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['Foo 4']));

      await tableUtil.toggleSort({index: 2});
      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'baz', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(2);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(3);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'descending'});
    });
  });

  describe('with fake timers', function () {
    beforeAll(function () {
      jest.useFakeTimers();
    });

    afterEach(function () {
      act(() => jest.runAllTimers());
      jest.clearAllMocks();
    });

    it('basic flow with TableTester', async function () {
      render(<TableExample />);

      tableUtil.setTable(screen.getByTestId('test'));
      await tableUtil.toggleRowSelection({index: 2});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Foo 3']));

      await tableUtil.toggleRowSelection({text: 'Foo 4'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['Foo 3', 'Foo 4']));

      await tableUtil.toggleSelectAll();
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect((onSelectionChange.mock.calls[2][0])).toEqual('all');

      await tableUtil.toggleSort({index: 2});
      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'bar', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(2);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(3);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'descending'});
    });


    it('basic flow with TableTester (testing menu sort change and highlight selection)', async function () {
      render(<TableExample allowsResizing selectionStyle="highlight" />);

      tableUtil.setTable(screen.getByTestId('test'));
      await tableUtil.toggleRowSelection({index: 2});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Foo 3']));

      await tableUtil.toggleRowSelection({text: 'Foo 4'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['Foo 4']));

      await tableUtil.toggleSort({index: 2});
      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'baz', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(2);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'ascending'});

      await tableUtil.toggleSort({text: 'Foo'});
      expect(onSortChange).toHaveBeenCalledTimes(3);
      expect(onSortChange).toHaveBeenLastCalledWith({column: 'foo', direction: 'descending'});
    });
  });

  // TODO: add RAC version of the above tests
});
