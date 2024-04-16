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

import {act, waitFor, within} from '@testing-library/react';

type InteractionType = 'mouse' | 'touch' | 'keyboard'

export class SelectTester {
  private user;
  private _interactionType: InteractionType;
  private _element: HTMLElement;
  private _trigger: HTMLElement;
  private _valueElement: HTMLElement;
  private _listbox: HTMLElement;
  private _options: HTMLElement[];
  // TODO: should we find the label/field error/etc for the user
  // what about value placeholder? Not entirely sure that there is a ton of value in helping the
  // user find those when they can be queried by getByText or by looking up the labeledby that the user already
  // provided

  constructor(opts) {
    // let {
    //   element,
    //   timerType = 'fake'
    // } = opts;
    // this.element = element;
    // this.timerType = timerType;
    this.user = opts.user;
    this._interactionType = opts.interactionType || 'mouse';
  }

  setElement(element: HTMLElement) {
    this._element = element;
    // Handle case where the wrapper element is provided rather than the Select's button (aka RAC)
    let triggerButton = within(this._element).queryByRole('button');
    if (triggerButton == null) {
      triggerButton = this._element;
    }
    this._trigger = triggerButton;
    this._valueElement = document.getElementById(triggerButton.getAttribute('aria-labelledby').split(' ')[0]);
    // Reset the previously obtained elements since we may be interacting with a different element now
    this._listbox = undefined;
    this._options = undefined;
  }

  setInteractionType(type: InteractionType) {
    this._interactionType = type;
  }

  async open() {
    if (!this._element) {
      console.error('Select element hasn\'t beeen set yet, please call setElement(element) to set which element to target.');
      return;
    }

    if (this._interactionType === 'mouse') {
      await this.user.click(this._trigger);
    } else if (this._interactionType === 'keyboard') {
      act(() => this._trigger.focus());
      await this.user.keyboard('[Enter]');
    } else if (this._interactionType === 'touch') {
      await this.user.pointer({target: this._trigger, keys: '[TouchA]'});
    }

    // TODO: so far this seems to work with real and fake timers. If we do run into a situation where we need to advance timers in here,
    // we can do something like detecting if fake timers (like in https://github.com/testing-library/react-testing-library/blame/c63b873072d62c858959c2a19e68f8e2cc0b11be/src/pure.js#L16)
    // are enabled and advance by a specific amount of time (here it would be doing advanceTimersBy perhaps by the transtion time or runOnlyPendingTimers)
    // Alternatively, maybe we need to accept an option for https://testing-library.com/docs/user-event/options/#advancetimers
    await waitFor(() => expect(this._trigger).toHaveAttribute('aria-controls'));
    let listBoxId = this._trigger.getAttribute('aria-controls');
    await waitFor(() => expect(document.getElementById(listBoxId)).toBeInTheDocument());
    this._listbox = document.getElementById(listBoxId);
    this.getOptions();
  }

  getOptions() {
    if (!this._trigger.getAttribute('aria-controls')) {
      console.error('Select listbox hasn\'t been set yet. Did you call `open()` yet?');
    } else if (!this._listbox) {
      let listBoxId = this._trigger.getAttribute('aria-controls');
      this._listbox = document.getElementById(listBoxId);
    }

    this._options = within(this._listbox).getAllByRole('option');
    return;
  }

  async selectOption(optionText) {
    if (!this._trigger.getAttribute('aria-controls')) {
      await this.open();
    } else {
      this.getOptions();
    }

    if (this._interactionType === 'keyboard') {
      if (document.activeElement !== this._listbox || !this._listbox.contains(document.activeElement)) {
        act(() => this._listbox.focus());
      }

      await this.user.keyboard(optionText);
      await this.user.keyboard('[Enter]');
    } else {
      // TODO: what if the user needs to scroll the list to find the option? What if there are multiple matches for text (hopefully the picker options are pretty unique)
      let option = within(this._listbox).getByText(optionText);
      if (this._interactionType === 'mouse') {
        await this.user.click(option);
      } else {
        await this.user.pointer({target: option, keys: '[TouchA]'});
      }
    }

    await waitFor(() => expect(document.activeElement).toBe(this.trigger));
    expect(this._listbox).not.toBeInTheDocument();
  }

  async close() {
    if (this._trigger.getAttribute('aria-controls')) {
      act(() => this._listbox.focus());
      await this.user.keyboard('[Escape]');
    }
    await waitFor(() => expect(document.activeElement).toBe(this.trigger));
    expect(this._listbox).not.toBeInTheDocument();
  }

  // TODO: perhaps these should be getElement/getTrigger/etc. That way the user could destruct them from the class without explicitlly triggering the getter
  get element() {
    if (!this._element) {
      console.error('Select element hasn\'t been set yet. Did you call `setElement()` yet?');
    }

    return this._element;
  }

  get trigger() {
    if (!this._trigger) {
      console.error('Select trigger hasn\'t been set yet. Did you call `setElement()` yet?');
    }

    return this._trigger;
  }

  get valueElement() {
    if (!this._valueElement) {
      console.error('Select value/placeholder element hasn\'t been set yet. Did you call `setElement()` yet?');
    }

    return this._valueElement;
  }

  get listbox() {
    // If user has triggered open the select themseleves, then grab the options and set the listbox element
    if (this._trigger.getAttribute('aria-controls')) {
      this.getOptions();
    } else if (!this._listbox) {
      console.error('Select listbox hasn\'t been set yet. Did you call `open()` yet?');
    }

    return this._listbox;
  }

  get options() {
    if (!this._options) {
      console.error('Select options hasn\'t been set yet. Did you call `open()` yet?');
    }

    return this._options;
  }

  get interactionType() {
    return this._interactionType;
  }

  // TODO: various getters? getHiddenSelect, getOption, getLabel, getTriggerElement? Or just have user access them via picker.trigger and stuff
  // TODO: what about assertions like picker.hasText? Or just rely on user using `expect(picker.trigger).toHaveTextContent('Three');`
}
