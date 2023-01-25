// Based on: http://tinlizzie.org/ometa/ometa-js-old/prolog-base.js
exports = {vars, clause, rule, solve};

function clause(...args){ return new Clause(...args); }
function rule(...args){ return new Rule(...args); }
function vars(...names){ return names.map( name => new Var(name)); }

function trace(type,  ...args){
	if(typeof process === 'undefined' || !process.env.TRACE) return;
	switch(type) {
		case 'stateStack':
			args[0].forEach((state, idx) => {
				let b = state.bindings.toAnswerString();
				console.log(
					`${idx == 0 ? '\n    stateStack: ' : '                '}`
					+ `${state.query.toAnswerString()} ${state.goals.length > 0 ? `:- ${state.goals.toAnswerString()}` : ''}`
					+ `, bindings: ${state.bindings.toAnswerString()}`

				);
			});
			break;

		case 'unified':
			let [goal, rule] = args;
			console.log(`    unified goal: ${goal.toAnswerString()} rule: ${rule.head.toAnswerString()}`
				+ `${rule.clauses.length > 0 ? ` :- ${rule.clauses.toAnswerString()}` : ''}`);
			break;
	}
}

Number.prototype.rewrite = function() {return this;};
Number.prototype.toAnswerString = function() {return this;};
Number.prototype.unify = function(that) {
	if(that instanceof Var) {
		that.unify(this);
	} else {
		assert(this === that);
	}
};

String.prototype.rewrite = function() {return this;};
String.prototype.toAnswerString = function() {return `'${this}'`;};
String.prototype.unify = function(that) {
	if(that instanceof Var) {
		that.binding = this;
		return that;
	} else {
		assert(this.toString() === (that instanceof Function ? that.name : that.toString())); // this/that can be Object in browser
	}
};

Function.prototype.rewrite = function() {return this;};
Function.prototype.toAnswerString = function() {return `Function: ${this.name}`;};
Function.prototype.unify = function(that) {
	if(that instanceof Var) {
		that.unify(this);
	} else {
		assert(this.name === (that instanceof Function ? that.name : that));
	}
};

Array.prototype.rewrite = function() { return this.map(function(x) { return x.rewrite(); }); };
Array.prototype.toAnswerString = function(){
	return `[ ${this.reduce((a, c) => a  + (c.toAnswerString() + ', '), '').replace(/, $/,'')} ]`;
};
Array.prototype.unify = function(array) {
	assert(array instanceof Array && this.length == array.length);
	let bindings = new Bindings();
	this.forEach((e, idx) => { bindings.add(e.unify(array[idx])); });
};

Object.prototype.rewrite = function() {
	return Object.fromEntries(Object.entries(this).map(e => [e[0], e[1].rewrite()]));
};
Object.prototype.toAnswerString = function(){
	return `{ ${Object.keys(this).reduce((a, key) => a  + `${key}: ${this[key].toAnswerString()}, `, '').replace(/, $/,'')} }`;
};
Object.prototype.unify = function(object) {
	assert(object instanceof Object && Object.keys(this).length == Object.keys(object).length);
	Object.keys(this).forEach((key) => { this[key].unify(object[key]); });
};

function Var(name) { this.name = name; }
Var.prototype.toAnswerString = function() {return this.name;};
Var.prototype.rewrite = function() {
	return this.binding
		? this.binding instanceof Var
			? (this.binding = this.binding.name === this.name ? this : this.binding.rewrite({}))
			: this.binding
		: this;
};

Var.prototype.unify = function(that, root=''){
	if(root !== this.name){ // test for circular reference
		if(typeof this.binding === 'undefined') {
			this.binding = that; // this not bound
		} else if(this.binding instanceof Var){
			this.binding.unify(that, root === '' ? this.name : root); // unify binding
			this.binding = that;
		} else {
			assert(false); //already bound
		}
		return this;
	}
};

function Clause(sym, args) { this.sym  = sym; this.args = args; }
Clause.prototype.rewrite = function() { return new Clause(this.sym, this.args.map(function(x) { return x.rewrite(); })); };
Clause.prototype.toAnswerString = function() { return (this.sym?.constructor.name === 'Function' ? this.sym.name : this.sym)
		+ "(" + this.args.map(function(x) { return x.toAnswerString(); }).join(", ") + ")";
};
Clause.prototype.unify = function(goal) {
	let bindings = new Bindings;
	if (goal instanceof Clause) {
		assert(goal.args.length == this.args.length);
		this.sym.unify(goal.sym);

		if(typeof this.sym == 'function') {
			return bindings.add(this.sym(goal.args));
		}
		this.args.forEach((arg, idx) => bindings.add(arg.unify(goal.args[idx])));
	} else {
		bindings.add(goal.unify(this));
	}
	return bindings;
};

function Bindings(o={}){ this.currentBindings = {...o}; }
Bindings.prototype.toAnswerString = function(){
	return `{ ${Object.entries(this.currentBindings).map(([n, v]) => [n, v.toAnswerString()])
		.reduce((a,[n, v]) => a += `${n}: ${v}, `, '').replace(/, $/,'') } }`;

};
Bindings.prototype.add = function(newBinding){
	if(newBinding instanceof Var){
		this.currentBindings[newBinding.name] = newBinding.binding;
	} else if(newBinding instanceof Bindings) {
		this.currentBindings = {...this.currentBindings, ...(newBinding.currentBindings)};
	}
	return this;
};

function Rule(head, clauses=[]) { this.head = head; this.clauses = clauses; }
function State(query, goals, bindings) { this.query = query; this.goals = goals; this.bindings = bindings; };
function assert(cond) { if (!cond) throw "unification failed"; }

const [X, Y] = vars('X', 'Y'),
	builtinRules = [
		rule(clause(function notEqual([arg1, arg2]) {
			assert((arg1 instanceof Var ? arg1.binding : arg1.toString()) != (arg2 instanceof Var ? arg2.binding : arg2.toString()));
			return new Bindings({'X': arg1, 'Y': arg2});
		}, [X, Y])),

		rule(clause(function isEqual([arg1, arg2]) {
			arg1.unify(arg2);
			return true;
		}, [X, Y]))
	];

function* solve(userQuery, userRules) {
	let userQueryArgs = userQuery.args,
		stateStack = [new State(userQuery instanceof Array ? {} : userQuery, userQuery instanceof Array ? userQuery : [userQuery], new Bindings)],
		rules = userRules.concat(builtinRules);

	while (true){
		if (stateStack.length == 0) return;
		trace('stateStack', stateStack);
		let {query: stateQuery, goals, bindings} = stateStack.pop();

		if (goals.length == 0) {
			yield userQueryArgs
				? Object.fromEntries(userQueryArgs.reduce((a, o) => a.concat([[o.name, bindings.currentBindings[o.name]]]), []))
				: bindings.currentBindings;
			continue;
		}

		let goal = goals.shift();

		rules.forEach(rule => {
			try{
				bindings.add(rule.head.unify(goal)); // throws error if unsuccessful
				trace('unified', goal, rule);
				let newGoals = goals.rewrite();
				rule.clauses.rewrite().forEach(clause => newGoals.push(clause));
				stateStack.push(new State(stateQuery.rewrite(), newGoals, new Bindings(bindings.currentBindings)));			
			}catch (e){
				if(e != "unification failed") console.error('error:', e.message);
				return ;
			}
		});
	}	
}
