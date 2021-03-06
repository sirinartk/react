/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
let ReactDOM = require('react-dom');
let ReactDOMServer = require('react-dom/server');
let Scheduler = require('scheduler');

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
  });

  it('renders children', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
  });

  it('unmounts children', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('');
  });

  it('supports hydration', async () => {
    const markup = await new Promise(resolve =>
      resolve(
        ReactDOMServer.renderToString(
          <div>
            <span className="extra" />
          </div>,
        ),
      ),
    );

    // Does not hydrate by default
    const container1 = document.createElement('div');
    container1.innerHTML = markup;
    const root1 = ReactDOM.unstable_createRoot(container1);
    root1.render(
      <div>
        <span />
      </div>,
    );
    Scheduler.unstable_flushAll();

    // Accepts `hydrate` option
    const container2 = document.createElement('div');
    container2.innerHTML = markup;
    const root2 = ReactDOM.unstable_createRoot(container2, {hydrate: true});
    root2.render(
      <div>
        <span />
      </div>,
    );
    expect(() => Scheduler.unstable_flushAll()).toWarnDev('Extra attributes', {
      withoutStack: true,
    });
  });

  it('does not clear existing children', async () => {
    container.innerHTML = '<div>a</div><div>b</div>';
    const root = ReactDOM.unstable_createRoot(container);
    root.render(
      <div>
        <span>c</span>
        <span>d</span>
      </div>,
    );
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('abcd');
    root.render(
      <div>
        <span>d</span>
        <span>c</span>
      </div>,
    );
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('abdc');
  });

  it('throws a good message on invalid containers', () => {
    expect(() => {
      ReactDOM.unstable_createRoot(<div>Hi</div>);
    }).toThrow(
      'unstable_createRoot(...): Target container is not a DOM element.',
    );
  });

  it('warns when rendering with legacy API into createRoot() container', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    expect(() => {
      ReactDOM.render(<div>Bye</div>, container);
    }).toWarnDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.render() on a container that was previously ' +
          'passed to ReactDOM.unstable_createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element)?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        'Replacing React-rendered children with a new root component.',
      ],
      {withoutStack: true},
    );
    Scheduler.unstable_flushAll();
    // This works now but we could disallow it:
    expect(container.textContent).toEqual('Bye');
  });

  it('warns when hydrating with legacy API into createRoot() container', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    expect(() => {
      ReactDOM.hydrate(<div>Hi</div>, container);
    }).toWarnDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.hydrate() on a container that was previously ' +
          'passed to ReactDOM.unstable_createRoot(). This is not supported. ' +
          'Did you mean to call createRoot(container, {hydrate: true}).render(element)?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        'Replacing React-rendered children with a new root component.',
      ],
      {withoutStack: true},
    );
  });

  it('warns when unmounting with legacy API (no previous content)', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    let unmounted = false;
    expect(() => {
      unmounted = ReactDOM.unmountComponentAtNode(container);
    }).toWarnDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.unmountComponentAtNode() on a container that was previously ' +
          'passed to ReactDOM.unstable_createRoot(). This is not supported. Did you mean to call root.unmount()?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        "The node you're attempting to unmount was rendered by React and is not a top-level container.",
      ],
      {withoutStack: true},
    );
    expect(unmounted).toBe(false);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('');
  });

  it('warns when unmounting with legacy API (has previous content)', () => {
    // Currently createRoot().render() doesn't clear this.
    container.appendChild(document.createElement('div'));
    // The rest is the same as test above.
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    let unmounted = false;
    expect(() => {
      unmounted = ReactDOM.unmountComponentAtNode(container);
    }).toWarnDev('Did you mean to call root.unmount()?', {withoutStack: true});
    expect(unmounted).toBe(false);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('');
  });

  it('warns when passing legacy container to createRoot()', () => {
    ReactDOM.render(<div>Hi</div>, container);
    expect(() => {
      ReactDOM.unstable_createRoot(container);
    }).toWarnDev(
      'You are calling ReactDOM.unstable_createRoot() on a container that was previously ' +
        'passed to ReactDOM.render(). This is not supported.',
      {withoutStack: true},
    );
  });
});
