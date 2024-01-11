
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function get_binding_group_value(group, __value, checked) {
        const value = new Set();
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.add(group[i].__value);
        }
        if (!checked) {
            value.delete(__value);
        }
        return Array.from(value);
    }
    function init_binding_group(group) {
        let _inputs;
        return {
            /* push */ p(...inputs) {
                _inputs = inputs;
                _inputs.forEach(input => group.push(input));
            },
            /* remove */ r() {
                _inputs.forEach(input => group.splice(group.indexOf(input), 1));
            }
        };
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\CustomInput.svelte generated by Svelte v3.59.2 */

    const file$2 = "src\\CustomInput.svelte";

    function create_fragment$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			add_location(input, file$2, 4, 0, 38);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*val*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*val*/ 1 && input.value !== /*val*/ ctx[0]) {
    				set_input_value(input, /*val*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CustomInput', slots, []);
    	let { val } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (val === undefined && !('val' in $$props || $$self.$$.bound[$$self.$$.props['val']])) {
    			console.warn("<CustomInput> was created without expected prop 'val'");
    		}
    	});

    	const writable_props = ['val'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CustomInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		val = this.value;
    		$$invalidate(0, val);
    	}

    	$$self.$$set = $$props => {
    		if ('val' in $$props) $$invalidate(0, val = $$props.val);
    	};

    	$$self.$capture_state = () => ({ val });

    	$$self.$inject_state = $$props => {
    		if ('val' in $$props) $$invalidate(0, val = $$props.val);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [val, input_input_handler];
    }

    class CustomInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { val: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CustomInput",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get val() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set val(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Toggle.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\Toggle.svelte";

    function create_fragment$1(ctx) {
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = text("Option 1");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Option 2");
    			button0.disabled = button0_disabled_value = /*chosenOption*/ ctx[0] === 1;
    			add_location(button0, file$1, 4, 0, 51);
    			button1.disabled = button1_disabled_value = /*chosenOption*/ ctx[0] === 2;
    			add_location(button1, file$1, 7, 0, 147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chosenOption*/ 1 && button0_disabled_value !== (button0_disabled_value = /*chosenOption*/ ctx[0] === 1)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*chosenOption*/ 1 && button1_disabled_value !== (button1_disabled_value = /*chosenOption*/ ctx[0] === 2)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Toggle', slots, []);
    	let { chosenOption = 1 } = $$props;
    	const writable_props = ['chosenOption'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toggle> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, chosenOption = 1);
    	const click_handler_1 = () => $$invalidate(0, chosenOption = 2);

    	$$self.$$set = $$props => {
    		if ('chosenOption' in $$props) $$invalidate(0, chosenOption = $$props.chosenOption);
    	};

    	$$self.$capture_state = () => ({ chosenOption });

    	$$self.$inject_state = $$props => {
    		if ('chosenOption' in $$props) $$invalidate(0, chosenOption = $$props.chosenOption);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [chosenOption, click_handler, click_handler_1];
    }

    class Toggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { chosenOption: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get chosenOption() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chosenOption(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function isValidEmail(val) {
        return val.includes('@');
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let custominput;
    	let updating_val;
    	let t0;
    	let toggle;
    	let updating_chosenOption;
    	let t1;
    	let input0;
    	let t2;
    	let label0;
    	let input1;
    	let t3;
    	let t4;
    	let h1;
    	let t6;
    	let label1;
    	let input2;
    	let t7;
    	let t8;
    	let label2;
    	let input3;
    	let t9;
    	let t10;
    	let label3;
    	let input4;
    	let t11;
    	let t12;
    	let input5;
    	let t13;
    	let button0;
    	let t15;
    	let hr;
    	let t16;
    	let form;
    	let input6;
    	let input6_class_value;
    	let t17;
    	let button1;
    	let t18;
    	let button1_disabled_value;
    	let current;
    	let binding_group;
    	let mounted;
    	let dispose;

    	function custominput_val_binding(value) {
    		/*custominput_val_binding*/ ctx[9](value);
    	}

    	let custominput_props = {};

    	if (/*val*/ ctx[0] !== void 0) {
    		custominput_props.val = /*val*/ ctx[0];
    	}

    	custominput = new CustomInput({ props: custominput_props, $$inline: true });
    	binding_callbacks.push(() => bind(custominput, 'val', custominput_val_binding));

    	function toggle_chosenOption_binding(value) {
    		/*toggle_chosenOption_binding*/ ctx[10](value);
    	}

    	let toggle_props = {};

    	if (/*selectedOption*/ ctx[2] !== void 0) {
    		toggle_props.chosenOption = /*selectedOption*/ ctx[2];
    	}

    	toggle = new Toggle({ props: toggle_props, $$inline: true });
    	binding_callbacks.push(() => bind(toggle, 'chosenOption', toggle_chosenOption_binding));
    	binding_group = init_binding_group(/*$$binding_groups*/ ctx[14][0]);

    	const block = {
    		c: function create() {
    			create_component(custominput.$$.fragment);
    			t0 = space();
    			create_component(toggle.$$.fragment);
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			input1 = element("input");
    			t3 = text("\n  Agree to terms?");
    			t4 = space();
    			h1 = element("h1");
    			h1.textContent = "Favorite Color?";
    			t6 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t7 = text("\n  Red");
    			t8 = space();
    			label2 = element("label");
    			input3 = element("input");
    			t9 = text("\n  Green");
    			t10 = space();
    			label3 = element("label");
    			input4 = element("input");
    			t11 = text("\n  Blue");
    			t12 = space();
    			input5 = element("input");
    			t13 = space();
    			button0 = element("button");
    			button0.textContent = "Save";
    			t15 = space();
    			hr = element("hr");
    			t16 = space();
    			form = element("form");
    			input6 = element("input");
    			t17 = space();
    			button1 = element("button");
    			t18 = text("Save");
    			attr_dev(input0, "type", "number");
    			add_location(input0, file, 31, 0, 700);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file, 34, 2, 754);
    			add_location(label0, file, 33, 0, 744);
    			add_location(h1, file, 38, 0, 830);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "name", "color");
    			input2.__value = "red";
    			input2.value = input2.__value;
    			add_location(input2, file, 40, 2, 865);
    			add_location(label1, file, 39, 0, 855);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "name", "color");
    			input3.__value = "green";
    			input3.value = input3.__value;
    			add_location(input3, file, 44, 2, 963);
    			add_location(label2, file, 43, 0, 953);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "name", "color");
    			input4.__value = "blue";
    			input4.value = input4.__value;
    			add_location(input4, file, 48, 2, 1065);
    			add_location(label3, file, 47, 0, 1055);
    			attr_dev(input5, "type", "text");
    			add_location(input5, file, 52, 0, 1156);
    			add_location(button0, file, 53, 0, 1204);
    			add_location(hr, file, 55, 0, 1277);
    			attr_dev(input6, "type", "email");
    			attr_dev(input6, "class", input6_class_value = "" + (null_to_empty(isValidEmail(/*enteredEmail*/ ctx[5]) ? "" : "invalid") + " svelte-u5nd84"));
    			add_location(input6, file, 58, 2, 1304);
    			attr_dev(button1, "type", "submit");
    			button1.disabled = button1_disabled_value = !/*formIsValid*/ ctx[7];
    			add_location(button1, file, 63, 2, 1421);
    			add_location(form, file, 57, 0, 1285);
    			binding_group.p(input2, input3, input4);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(custominput, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(toggle, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*price*/ ctx[1]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, label0, anchor);
    			append_dev(label0, input1);
    			input1.checked = /*agreed*/ ctx[3];
    			append_dev(label0, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, label1, anchor);
    			append_dev(label1, input2);
    			input2.checked = ~(/*favColor*/ ctx[4] || []).indexOf(input2.__value);
    			append_dev(label1, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, label2, anchor);
    			append_dev(label2, input3);
    			input3.checked = ~(/*favColor*/ ctx[4] || []).indexOf(input3.__value);
    			append_dev(label2, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, label3, anchor);
    			append_dev(label3, input4);
    			input4.checked = ~(/*favColor*/ ctx[4] || []).indexOf(input4.__value);
    			append_dev(label3, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, input5, anchor);
    			/*input5_binding*/ ctx[17](input5);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, input6);
    			set_input_value(input6, /*enteredEmail*/ ctx[5]);
    			append_dev(form, t17);
    			append_dev(form, button1);
    			append_dev(button1, t18);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[12]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[13]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[15]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[16]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[18], false, false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[19]),
    					listen_dev(form, "submit", /*submit_handler*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const custominput_changes = {};

    			if (!updating_val && dirty & /*val*/ 1) {
    				updating_val = true;
    				custominput_changes.val = /*val*/ ctx[0];
    				add_flush_callback(() => updating_val = false);
    			}

    			custominput.$set(custominput_changes);
    			const toggle_changes = {};

    			if (!updating_chosenOption && dirty & /*selectedOption*/ 4) {
    				updating_chosenOption = true;
    				toggle_changes.chosenOption = /*selectedOption*/ ctx[2];
    				add_flush_callback(() => updating_chosenOption = false);
    			}

    			toggle.$set(toggle_changes);

    			if (dirty & /*price*/ 2 && to_number(input0.value) !== /*price*/ ctx[1]) {
    				set_input_value(input0, /*price*/ ctx[1]);
    			}

    			if (dirty & /*agreed*/ 8) {
    				input1.checked = /*agreed*/ ctx[3];
    			}

    			if (dirty & /*favColor*/ 16) {
    				input2.checked = ~(/*favColor*/ ctx[4] || []).indexOf(input2.__value);
    			}

    			if (dirty & /*favColor*/ 16) {
    				input3.checked = ~(/*favColor*/ ctx[4] || []).indexOf(input3.__value);
    			}

    			if (dirty & /*favColor*/ 16) {
    				input4.checked = ~(/*favColor*/ ctx[4] || []).indexOf(input4.__value);
    			}

    			if (!current || dirty & /*enteredEmail*/ 32 && input6_class_value !== (input6_class_value = "" + (null_to_empty(isValidEmail(/*enteredEmail*/ ctx[5]) ? "" : "invalid") + " svelte-u5nd84"))) {
    				attr_dev(input6, "class", input6_class_value);
    			}

    			if (dirty & /*enteredEmail*/ 32 && input6.value !== /*enteredEmail*/ ctx[5]) {
    				set_input_value(input6, /*enteredEmail*/ ctx[5]);
    			}

    			if (!current || dirty & /*formIsValid*/ 128 && button1_disabled_value !== (button1_disabled_value = !/*formIsValid*/ ctx[7])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(custominput.$$.fragment, local);
    			transition_in(toggle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(custominput.$$.fragment, local);
    			transition_out(toggle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(custominput, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(toggle, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(label2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(label3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(input5);
    			/*input5_binding*/ ctx[17](null);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(form);
    			binding_group.r();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let val = "Max";
    	let price = 0;
    	let selectedOption = 1;
    	let agreed;
    	let favColor = ["green"];
    	let usernameInput;
    	let customInput;
    	let enteredEmail = "";
    	let formIsValid = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function submit_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function custominput_val_binding(value) {
    		val = value;
    		$$invalidate(0, val);
    	}

    	function toggle_chosenOption_binding(value) {
    		selectedOption = value;
    		$$invalidate(2, selectedOption);
    	}

    	function input0_input_handler() {
    		price = to_number(this.value);
    		$$invalidate(1, price);
    	}

    	function input1_change_handler() {
    		agreed = this.checked;
    		$$invalidate(3, agreed);
    	}

    	function input2_change_handler() {
    		favColor = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(4, favColor);
    	}

    	function input3_change_handler() {
    		favColor = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(4, favColor);
    	}

    	function input4_change_handler() {
    		favColor = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(4, favColor);
    	}

    	function input5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			usernameInput = $$value;
    			$$invalidate(6, usernameInput);
    		});
    	}

    	const click_handler = () => console.log(usernameInput.value);

    	function input6_input_handler() {
    		enteredEmail = this.value;
    		$$invalidate(5, enteredEmail);
    	}

    	$$self.$capture_state = () => ({
    		CustomInput,
    		Toggle,
    		isValidEmail,
    		val,
    		price,
    		selectedOption,
    		agreed,
    		favColor,
    		usernameInput,
    		customInput,
    		enteredEmail,
    		formIsValid
    	});

    	$$self.$inject_state = $$props => {
    		if ('val' in $$props) $$invalidate(0, val = $$props.val);
    		if ('price' in $$props) $$invalidate(1, price = $$props.price);
    		if ('selectedOption' in $$props) $$invalidate(2, selectedOption = $$props.selectedOption);
    		if ('agreed' in $$props) $$invalidate(3, agreed = $$props.agreed);
    		if ('favColor' in $$props) $$invalidate(4, favColor = $$props.favColor);
    		if ('usernameInput' in $$props) $$invalidate(6, usernameInput = $$props.usernameInput);
    		if ('customInput' in $$props) $$invalidate(20, customInput = $$props.customInput);
    		if ('enteredEmail' in $$props) $$invalidate(5, enteredEmail = $$props.enteredEmail);
    		if ('formIsValid' in $$props) $$invalidate(7, formIsValid = $$props.formIsValid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*enteredEmail*/ 32) {
    			if (isValidEmail(enteredEmail)) {
    				$$invalidate(7, formIsValid = true);
    			} else {
    				$$invalidate(7, formIsValid = false);
    			}
    		}

    		if ($$self.$$.dirty & /*val*/ 1) {
    			console.log(val);
    		}

    		if ($$self.$$.dirty & /*selectedOption*/ 4) {
    			console.log(selectedOption);
    		}

    		if ($$self.$$.dirty & /*price*/ 2) {
    			console.log(price);
    		}

    		if ($$self.$$.dirty & /*agreed*/ 8) {
    			console.log(agreed);
    		}

    		if ($$self.$$.dirty & /*favColor*/ 16) {
    			console.log(favColor);
    		}
    	};

    	console.log(customInput);

    	return [
    		val,
    		price,
    		selectedOption,
    		agreed,
    		favColor,
    		enteredEmail,
    		usernameInput,
    		formIsValid,
    		submit_handler,
    		custominput_val_binding,
    		toggle_chosenOption_binding,
    		input0_input_handler,
    		input1_change_handler,
    		input2_change_handler,
    		$$binding_groups,
    		input3_change_handler,
    		input4_change_handler,
    		input5_binding,
    		click_handler,
    		input6_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
