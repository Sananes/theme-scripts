## Description

A component that controls the state of a predictive search UI.

## Example

```js
const predictivesearch = new PredictiveSearch({
  selectors: {
    input: '[data-predictive-search-input="header"]',
    reset: '[data-predictive-search-reset="header"]',
    result: '[data-predictive-search-result="header"]'
  },
  resultTemplateFct: data => {
    return `
      <div class="predictive-search">
        <ul class="predictive-search__list">
          ${products.map(
            product => `
            <li>
              <img src="${product.image}" alt="${product.title}" />
              <span>${produtc.title}</span>
            </li>
          `
          )}
        </ul>
      </div>
    `;
  },
  onInputFocus: nodes => {
    // You can get a reference to active target
    console.log(nodes.input.id); //-> input
    console.log(nodes.submit.id); //-> submit
    console.log(nodes.result.id); //-> result
  },
  onInputKeyup: nodes => {
    return true; // This will allow the event callback to execute
  },
  onInputBlur: nodes => {
    return false; // This will prevent the event callback to execute
  },
  onInputClear: nodes => {},
  onBeforeKill: nodes => {},
  onBeforeOpen: nodes => {},
  onOpen: nodes => {},
  onBeforeClose: nodes => {},
  onClose: nodes => {},
  onKill: nodes => {}
});

// Public methods
predictivesearch.open();
predictivesearch.close();
predictivesearch.kill();
```

---
