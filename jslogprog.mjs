// Based on: http://tinlizzie.org/ometa/ometa-js-old/prolog-base.js
'use strict';
export {vars, clause, rule, assert, solve, Var};

const clause = (...args) => new Clause(...args),
	rule = (...args) => new Rule(...args),
	vars = (...names) => names.map( name => new Var(name) );

function trace(type,  ...args){
	if(!process.env.TRACE) return;
	switch(type) {
		case 'stateStack':
			args[0].forEach((state, idx) => {
				console.log(
					`${idx == 0 ? '\n    stateStack: ' : '                '}`
					+ `${state.query.toAnswerString()} ${state.goals.length > 0 ? `:- ${state.goals.toAnswerString()}` : ''}`
				);
			});
			break;

		case 'unified':
			let [goal, rule, env] = args;
			console.log(`    unified goal: ${goal.toAnswerString()} rule: ${rule.head.toAnswerString()}`
				+ `${rule.clauses.length > 0 ? ` :- ${rule.clauses.toAnswerString()}` : ''}`
				+ `${Object.keys(env).length > 0 ? ` env: ${env.toAnswerString()}` : ''}`);
			break;
	}
}

Number.prototype.rewrite = function(env) {return this;};
Number.prototype.toAnswerString = function() {return this;};
Number.prototype.unify = function(that, env) {
	if(that instanceof Var) {
		if (env[that.name])
			this.unify(env[that.name], env);
		else
			//addBinding(env, that.name, this.rewrite(env));
			env[that.name] = this.rewrite(env);
	} else {
		assert(this === that);
	}
};

String.prototype.rewrite = function(env) {return this;};
String.prototype.toAnswerString = function() {return `'${this}'`;};
String.prototype.unify = function(that, env) {
	if(that instanceof Var) {
		if (env[that.name])
			this.unify(env[that.name], env);
		else
			//addBinding(env, that.name, this.rewrite(env));
			env[that.name] = this.rewrite(env);
	} else {
		assert(this === (that instanceof Function ? that.name : that));
	}
};

Function.prototype.rewrite = function(env) {return this;};
Function.prototype.toAnswerString = function() {return `Function: ${this.name}`;};
Function.prototype.unify = function(that, env) {
	if(that instanceof Var) {
		if (env[that.name])
			this.unify(env[that.name], env);
		else
			//addBinding(env, that.name, this.rewrite(env));
			env[that.name] = this.rewrite(env);
	} else {
		assert(this.name === (that instanceof Function ? that.name : that));
	}
};

Array.prototype.rewrite = function(env) { return this.map(function(x) { return x.rewrite(env); }); };
Array.prototype.toAnswerString = function(){
	let s = this.reduce((a, c) => a  + (c.toAnswerString() + ', '), '');
	return `[ ${s.length > 0 ? s.slice(0,-2) : s} ]`;
};
Array.prototype.unify = function(array, env) {
	assert(array instanceof Array && this.length == array.length);
	this.forEach((e, idx) => { e.unify(array[idx], env); });
};

Object.prototype.rewrite = function(env) {
	let o={};
	Object.keys(this).forEach(key => o[key] = this[key].rewrite(env));
	return o;
};
Object.prototype.toAnswerString = function(){
	let s = Object.keys(this).reduce((a, key) => a  + `${key}: ${this[key].toAnswerString()}, `, '');
	return `{ ${s.length > 0 ? s.slice(0,-2) : s} }`;
};
Object.prototype.unify = function(object, env) {
	assert(object instanceof Object && Object.keys(this).length == Object.keys(object).length);
	Object.keys(this).forEach((key) => { this[key].unify(object[key], env); });
};

function Var(name) { this.name = name; }
Var.prototype.rewrite = function(env) { return env[this.name] ? env[this.name] : this; };
Var.prototype.toAnswerString = function() { return this.value ? this.value.toAnswerString() : this.name; };
Var.prototype.unify = function(that, env={}){
	if (env[this.name]) {
		env[this.name].unify(that, env);
	} else {
		// This does next statement: addBinding(env, this.name, that instanceof Var ? that.rewrite(env) : that);
		env[this.name] = that instanceof Var ? that.rewrite(env) : that;
	}
	if(this != env[this.name])this.value = env[this.name];
	return env;
};

function Clause(sym, args) { this.sym  = sym; this.args = args; }
Clause.prototype.rewrite = function(env) { return new Clause(this.sym, this.args.map(function(x) { return x.rewrite(env); })); };
Clause.prototype.toAnswerString = function() { return (this.sym.constructor.name === 'Function' ? this.sym.name : this.sym)
		+ "(" + this.args.map(function(x) { return x.toAnswerString(); }).join(", ") + ")";
};
Clause.prototype.unify = function(goal, env) {
	if (goal instanceof Clause) {
		assert(goal.args.length == this.args.length);
		this.sym.unify(goal.sym, env);

		if(typeof this.sym == 'function') {
			assert(this.sym(goal.args, env));
			return;
		}
		this.args.forEach((arg, idx) => arg.unify(goal.args[idx], env));
	} else {
		goal.unify(this, env);
	}
	return env;
};

function Rule(head, clauses=[]) { this.head = head; this.clauses = clauses; }
function State(query, goals) { this.query = query; this.goals = goals;};
function assert(cond) { if (!cond) throw "unification failed"; }

const [X, Y] = vars('X', 'Y'),
	builtinRules = [
		rule(clause(function notEqual([arg1, arg2]) {
			return (arg1 instanceof Var) || (arg2 instanceof Var) || (arg1 != arg2);
		}, [X, Y])),

		rule(clause(function isEqual([arg1, arg2], env) {
			arg1.unify(arg2, env);
			return true;
		}, [X, Y]))
	];

function* solve(query, userRules) {
	let queryArgs = query.args,
		stateStack = [new State(query, [query])],
		rules = userRules.concat(builtinRules);

	while (true){
		if (stateStack.length == 0) return;
		trace('stateStack', stateStack);
		let {query, goals} = stateStack.pop();

		if (goals.length == 0) {
			let result = {},
				flat_queryArgs = queryArgs.flat(Infinity);

			query.args.flat(Infinity).forEach((arg, idx) => {
				if(flat_queryArgs[idx] instanceof Var) {
					result[flat_queryArgs[idx].name] = arg.name ? arg.name : arg;
					flat_queryArgs[idx].value = arg.name ? arg.name : arg;
				}
			});
			yield result;
			continue;
		}

		let goal = goals.shift();

		rules.forEach(rule => {
			let env; // NOTE: env is mutated by unify and rewrite
			
			try{
				rule.head.unify(goal, env = {}); // throws error if unsuccessful
				trace('unified', goal, rule, env);
				let newGoals = goals.rewrite(env);
				rule.clauses.rewrite(env).forEach(clause => newGoals.push(clause));
				stateStack.push(new State(query.rewrite(env), newGoals, env));			
			}catch (e){
				if(e != "unification failed") console.error('error:', JSON.stringify(e));
				return;
			}
		});
	}	
}
