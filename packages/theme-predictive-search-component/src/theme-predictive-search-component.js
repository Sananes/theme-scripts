import PredictiveSearch from "@shopify/theme-predictive-search";

function PredictiveSearchComponent(config) {
  // validate config
  if (
    !config ||
    !config.selectors ||
    !config.selectors.input ||
    !isString(config.selectors.input) ||
    !config.selectors.result ||
    !isString(config.selectors.result) ||
    !config.resultTemplateFct ||
    !isFunction(config.resultTemplateFct)
  ) {
    var error = new TypeError("config is not valid");
    error.type = "argument";
    throw error;
  }

  // Find nodes
  this.nodes = findNodes(config.selectors);

  // Validate nodes
  if (!isValidNodes(this.nodes)) {
    // eslint-disable-next-line no-console
    console.warn("Could not find valid nodes");
    return;
  }

  // Assign result template
  this.resultTemplateFct = config.resultTemplateFct;

  // Assign number of search results
  this.numberOfResults = config.numberOfResults || 4;

  // Set classes
  this.classes = {
    visibleVariant:
      config.visibleVariant && config.visibleVariant.length > 0
        ? config.visibleVariant
        : "predictive-search-wrapper--visible"
  };

  // Assign callbacks
  this.callbacks = assignCallbacks(config);

  // Add input attributes
  addInputAttributes(this.nodes.input);

  // Add input event listeners
  this._addInputEventListeners();

  // Add body listener
  this._addBodyEventListener();

  // Istantiate Predictive Search API
  this.predictiveSearch = new PredictiveSearch({
    resources: {
      fuzzy: true,
      types: [PredictiveSearch.TYPES.PRODUCT]
    }
  });

  // Add predictive search success event listener
  this.predictiveSearch.on(
    "success",
    this._handlePredictiveSearchSuccess.bind(this)
  );

  // Add predictive search error event listener
  this.predictiveSearch.on(
    "error",
    this._handlePredictiveSearchError.bind(this)
  );
}

/**
 * Private methods
 */
function findNodes(selectors) {
  return {
    input: document.querySelector(selectors.input),
    reset: document.querySelector(selectors.reset),
    result: document.querySelector(selectors.result)
  };
}

function isValidNodes(nodes) {
  if (
    !nodes ||
    !nodes.input ||
    !nodes.result ||
    nodes.input.tagName !== "INPUT"
  ) {
    return false;
  }

  return true;
}

function assignCallbacks(config) {
  return {
    onBodyMousedown: config.onBodyMousedown,
    onBeforeOpen: config.onBeforeOpen,
    onOpen: config.onOpen,
    onBeforeClose: config.onBeforeClose,
    onClose: config.onClose,
    onInputFocus: config.onInputFocus,
    onInputKeyup: config.onInputKeyup,
    onInputBlur: config.onInputBlur,
    onInputReset: config.onInputReset,
    onBeforeKill: config.onBeforeKill,
    onKill: config.onKill
  };
}

function addInputAttributes(input) {
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");
}

function removeInputAttributes(input) {
  input.removeAttribute("autocorrect", "off");
  input.removeAttribute("autocomplete", "off");
  input.removeAttribute("autocapitalize", "off");
  input.removeAttribute("spellcheck", "false");
}

/**
 * Public variables
 */
PredictiveSearchComponent.prototype.isResultVisible = false;
PredictiveSearchComponent.prototype.results = {};

/**
 * "Private" variables
 */
PredictiveSearchComponent.prototype._latencyTimer = null;
PredictiveSearchComponent.prototype._resultNodeClicked = false;

/**
 * "Private" instance methods
 */
PredictiveSearchComponent.prototype._addInputEventListeners = function() {
  var input = this.nodes.input;
  var reset = this.nodes.reset;

  if (!input) {
    return;
  }

  this._handleInputFocus = this._handleInputFocus.bind(this);
  this._handleInputBlur = this._handleInputBlur.bind(this);
  this._handleInputKeyup = this._handleInputKeyup.bind(this);

  input.addEventListener("focus", this._handleInputFocus);
  input.addEventListener("blur", this._handleInputBlur);
  input.addEventListener("keyup", this._handleInputKeyup);

  if (reset) {
    this._handleInputReset = this._handleInputReset.bind(this);
    reset.addEventListener("click", this._handleInputReset);
  }
};

PredictiveSearchComponent.prototype._removeInputEventListeners = function() {
  var input = this.nodes.input;

  input.removeEventListener("focus", this._handleInputFocus);
  input.removeEventListener("blur", this._handleInputBlur);
  input.removeEventListener("keyup", this._handleInputKeyup);
  input.removeEventListener("search", this._handleInputReset);
};

PredictiveSearchComponent.prototype._addBodyEventListener = function() {
  this._handleBodyMousedown = this._handleBodyMousedown.bind(this);

  document
    .querySelector("body")
    .addEventListener("mousedown", this._handleBodyMousedown);
};

PredictiveSearchComponent.prototype._removeBodyEventListener = function() {
  document
    .querySelector("body")
    .removeEventListener("mousedown", this._handleBodyMousedown);
};

/**
 * Event handlers
 */
PredictiveSearchComponent.prototype._handleBodyMousedown = function(evt) {
  if (this.isResultVisible && this.nodes !== null) {
    if (
      evt.target.isEqualNode(this.nodes.input) ||
      this.nodes.input.contains(evt.target) ||
      evt.target.isEqualNode(this.nodes.result) ||
      this.nodes.result.contains(evt.target)
    ) {
      this._resultNodeClicked = true;
    } else {
      if (isFunction(this.callbacks.onBodyMousedown)) {
        var returnedValue = this.callbacks.onBodyMousedown(this.nodes);
        if (isBoolean(returnedValue) && returnedValue) {
          this.close();
        }
      } else {
        this.close();
      }
    }
  }
};

PredictiveSearchComponent.prototype._handleInputFocus = function(evt) {
  if (isFunction(this.callbacks.onInputFocus)) {
    var returnedValue = this.callbacks.onInputFocus(this.nodes);
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  if (evt.target.value.length > 0) {
    this._search();
  }

  return true;
};

PredictiveSearchComponent.prototype._handleInputBlur = function() {
  if (isFunction(this.callbacks.onInputBlur)) {
    var returnedValue = this.callbacks.onInputBlur(this.nodes);
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  if (document.activeElement.isEqualNode(this.nodes.reset)) {
    return false;
  }

  if (this._resultNodeClicked) {
    this._resultNodeClicked = false;
    return false;
  }

  this.close();

  return true;
};

PredictiveSearchComponent.prototype._handleInputKeyup = function(evt) {
  if (isFunction(this.callbacks.onInputKeyup)) {
    var returnedValue = this.callbacks.onInputKeyup(this.nodes);
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  if (evt.which === 8 && evt.target.value.length <= 0) {
    this.close();
  } else if (evt.target.value.length > 0) {
    this._search();
  }

  return true;
};

PredictiveSearchComponent.prototype._handleInputReset = function(evt) {
  evt.preventDefault();

  if (isFunction(this.callbacks.onInputReset)) {
    var returnedValue = this.callbacks.onInputReset(this.nodes);
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  this.nodes.input.value = "";

  return true;
};

PredictiveSearchComponent.prototype._search = function() {
  clearTimeout(this._latencyTimer);
  this._latencyTimer = setTimeout(
    function() {
      this.results.isLoading = true;

      this.nodes.result.classList.add(this.classes.visibleVariant);
      // NOTE: We could benifit in using DOMPurify.
      // https://github.com/cure53/DOMPurify
      this.nodes.result.innerHTML = this.resultTemplateFct(this.results);
    }.bind(this),
    300
  );

  this.predictiveSearch.query(this.nodes.input.value);
};

PredictiveSearchComponent.prototype._handlePredictiveSearchSuccess = function(
  json
) {
  clearTimeout(this._latencyTimer);
  this.results = json.resources.results;

  this.results.isLoading = false;
  this.results.products = this.results.products.slice(0, this.numberOfResults);

  if (this.results.products.length > 0) {
    this.nodes.result.innerHTML = this.resultTemplateFct(this.results);
    this.open();
  } else {
    this.nodes.result.innerHTML = "";

    this._closeOnNoResults();
  }
};

PredictiveSearchComponent.prototype._handlePredictiveSearchError = function() {
  clearTimeout(this._latencyTimer);
  this.nodes.result.innerHTML = "";

  this._closeOnNoResults();
};

PredictiveSearchComponent.prototype._closeOnNoResults = function() {
  if (this.nodes) {
    this.nodes.result.classList.remove(this.classes.visibleVariant);
  }

  this.isResultVisible = false;
};

/**
 * Public methods
 */
PredictiveSearchComponent.prototype.open = function() {
  if (this.isResultVisible) {
    return;
  }

  if (isFunction(this.callbacks.onBeforeOpen)) {
    var returnedValue = this.callbacks.onBeforeOpen(this.nodes);
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  this.nodes.result.classList.add(this.classes.visibleVariant);
  this.isResultVisible = true;

  if (isFunction(this.callbacks.onOpen)) {
    return this.callbacks.onOpen(this.nodes) || true;
  }

  return true;
};

PredictiveSearchComponent.prototype.close = function() {
  if (!this.isResultVisible) {
    return true;
  }

  if (isFunction(this.callbacks.onBeforeClose)) {
    var returnedValue = this.callbacks.onBeforeClose(this.nodes);
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  if (this.nodes) {
    this.nodes.result.classList.remove(this.classes.visibleVariant);
  }

  if (isFunction(this.callbacks.onClose)) {
    this.callbacks.onClose(this.nodes);
  }

  this.isResultVisible = false;
  this.results = {};

  return true;
};

PredictiveSearchComponent.prototype.kill = function() {
  if (isFunction(this.callbacks.onBeforeKill)) {
    var returnedValue = this.callbacks.onBeforeKill();
    if (isBoolean(returnedValue) && !returnedValue) {
      return false;
    }
  }

  this.nodes.result.classList.remove(this.classes.visibleVariant);
  removeInputAttributes(this.nodes.input);
  this._removeInputEventListeners();
  this._removeBodyEventListener();

  if (isFunction(this.callbacks.onKill)) {
    this.callbacks.onKill();
  }

  return true;
};

/**
 * Utilities
 */
function getTypeOf(value) {
  return Object.prototype.toString.call(value);
}

function isString(value) {
  return getTypeOf(value) === "[object String]";
}

function isBoolean(value) {
  return getTypeOf(value) === "[object Boolean]";
}

function isFunction(value) {
  return getTypeOf(value) === "[object Function]";
}

export default PredictiveSearchComponent;
