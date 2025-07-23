// Polyfills for IE11 compatibility

// Array.prototype.forEach polyfill
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError('this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            var kValue;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}

// Array.prototype.find polyfill
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = parseInt(list.length) || 0;
        var thisArg = arguments[1];
        for (var i = 0; i < length; i++) {
            var element = list[i];
            if (predicate.call(thisArg, element, i, list)) {
                return element;
            }
        }
        return undefined;
    };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = parseInt(o.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = fromIndex || 0;
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (o[k] === searchElement) {
                return true;
            }
            k++;
        }
        return false;
    };
}

// String.prototype.startsWith polyfill
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// Element.closest polyfill
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// Element.matches polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;
        };
}

// NodeList.forEach polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// CustomEvent polyfill
(function() {
    if (typeof window.CustomEvent === 'function') return false;
    
    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Promise polyfill (basic)
if (!window.Promise) {
    window.Promise = function(executor) {
        var self = this;
        self.status = 'pending';
        self.value = undefined;
        self.reason = undefined;
        self.onFulfilledCallbacks = [];
        self.onRejectedCallbacks = [];
        
        function resolve(value) {
            if (self.status === 'pending') {
                self.status = 'fulfilled';
                self.value = value;
                self.onFulfilledCallbacks.forEach(function(callback) {
                    callback(value);
                });
            }
        }
        
        function reject(reason) {
            if (self.status === 'pending') {
                self.status = 'rejected';
                self.reason = reason;
                self.onRejectedCallbacks.forEach(function(callback) {
                    callback(reason);
                });
            }
        }
        
        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    };
    
    Promise.prototype.then = function(onFulfilled, onRejected) {
        var self = this;
        var promise2 = new Promise(function(resolve, reject) {
            if (self.status === 'fulfilled') {
                setTimeout(function() {
                    try {
                        var x = onFulfilled(self.value);
                        resolve(x);
                    } catch (e) {
                        reject(e);
                    }
                });
            } else if (self.status === 'rejected') {
                setTimeout(function() {
                    try {
                        var x = onRejected(self.reason);
                        resolve(x);
                    } catch (e) {
                        reject(e);
                    }
                });
            } else if (self.status === 'pending') {
                self.onFulfilledCallbacks.push(function(value) {
                    setTimeout(function() {
                        try {
                            var x = onFulfilled(value);
                            resolve(x);
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
                self.onRejectedCallbacks.push(function(reason) {
                    setTimeout(function() {
                        try {
                            var x = onRejected(reason);
                            resolve(x);
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
            }
        });
        return promise2;
    };
}

// fetch polyfill (basic)
if (!window.fetch) {
    window.fetch = function(url, options) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(options && options.method ? options.method : 'GET', url);
            
            if (options && options.headers) {
                Object.keys(options.headers).forEach(function(key) {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                        ok: true,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        text: function() {
                            return Promise.resolve(xhr.responseText);
                        },
                        json: function() {
                            return Promise.resolve(JSON.parse(xhr.responseText));
                        }
                    });
                } else {
                    reject({
                        ok: false,
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
            
            xhr.onerror = function() {
                reject({
                    ok: false,
                    status: 0,
                    statusText: 'Network Error'
                });
            };
            
            xhr.send(options && options.body ? options.body : null);
        });
    };
} 