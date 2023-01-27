# JSLogProg

JSLogProg is an implementation of Prolog-like logic programming in Javascript (JS). It implements Var, Clause, Rule and Query objects for the equivalent Prolog items and implements Prolog unification and goal resolution.

# JSLogProg Concepts

You can define and run a Prolog-like program in JSLogProg.
- A JSLogProg *Var* is equivalent to a Prolog variable. A JSLogProg atom can be a JS number, string, function, array or object. Arrays and objects can contain *Vars* as elements and properties, respectively, and may be nested.
- Unification is defined for *Var* and JS number, string, function, array and object.
- A JSLogProg program is created using *rule* and *clause* functions.
- A program is run by defining a *query* and providing it, along with an array of *rules* to a *solve* function, which returns on or more solutions. A solution is a binding of a *query Var* to an atom (JS number, string, function, array or object).

Here is an example JSLogProg program:
```
import {rule, clause, solve} from './jslogprog.mjs';

function g(){console.log('g');};
function h(){console.log('h');};

const rules = [
	rule(clause('type1', g)),
	rule(clause('type2', g)),
	rule(clause('type2', h)),
	rule(clause('type3', [1,2,3])),
	rule(clause('type4', {key: 'value'})),
	rule(clause('type5', 'abc'))
];

const query = clause('type2', 'X');

for (const solution of solve(query, rules)){
	console.log(`solution: ${solution.toAnswerString()}`);
	console.log(solution.X());
}
console.log ('No more solutions');

// solution: '{ X: Function g }'
// 'g'
// solution: '{ X: Function h }'
// 'h'
// No more solutions
```

JSLogProg can be used without rules, clauses and queries. For example:
```
import {vars} from './jslogprog.mjs';

let [W, X, Y, Z] = vars('W', 'X', 'Y', 'Z'); // define Variables W, X, Y and Z
try{
	let o = [1,{a:W, b:15},3];
	o.unify([1, {a:10, b:15}, 3}])
	console.log(o.rewrite().toAnswerString()); // rewrite all Variables in o, i.e. 10 as W, and format for display
	X.unify(Y);
	Y.unify(Z);
	Z.unify(X); // Circular Variable reference
	Z.unify(5); // X=Y=Z=5
	X.unify(function f(){}); // Throws "unification failed" error
} catch(e) {
	e === "unification failed"
}
```
JSLogProg unification is straightforward:
- A Variable unifies with Variable, number, string, function, array, object
- A number unifies with the same number
- A string unifies with the same string or a function where function.name === string
- A function unifies with the same function
- An array unifies with an array of the same length and where the array elements unify
- An object unifies with an object with the same keys and where the object properties unify

# JSLogProg API

The JSLogProg API consists of:
- `clause`, `rule`, and `solve` for creating and running JSLogProg programs.
- `Var` and `vars` for creating JSLogProg variables.
- Common JSLogProg methods for JSLogProg terms (Var, number, string, function, array and object) for unification and output.

These are accessed via the jslogprog.mjs exports `{vars, clause, rule, solve, vars, Var, Bindings}`.

## `newClause = clause(name, ...arguments)`
The clause function returns an instance of `Clause` with the `name` and `arguments`. It is a convenience function that replaces `new Clause`. Variables in `arguments` can be instances of `Var`. Or, they can be denoted by strings that begin with '_' or an uppercase letter, i.e. the Prolog convention for variable names.

`newClause` (Clause) instance of Clause

`name` (string) clause name

`arguments` (Var, number, string, function, array, object) clause arguments

## `newRule = rule(head, ...body)`
The rule function returns an instance of `Rule` with the `head` and `body`. It is a convenience function that replaces ```new Rule```.

`newRule` (Rule) instance of Rule

`head` (Clause) rule head

`body` (Clause) rule body (one or more clauses)

## `[X | [W, Y, Z]] = vars(...arguments)`
The vars function returns new variable instances whose names are `arguments`. A single new variable instance is returned if arguments is a single name. Otherwise an array of new variable instances is returned. It is a convenience function that replaces ```new Var```.

## `solution = solve(query, rules)`
`solution` (object) solution to query. `solution` keys are query Vars and properties are Var bindings, e.g. {X: 'abc', Y: 2}.

`query` (clause | [clause1, ...]) query clause(s).

`rules` (Array) Array of Rules

## `Var`

The `Var` class defines the behavior for JSLogProg variable.

### Constructor
`let newVar = new Var(name)` where `name` is a string.

### Properties
`name` Var instance name.

`binding` Undefined if the Var instance is unbound or else it is a type of string or number or instance of Var, Function, Array or Object.

### Methods
`binding = newVar.unify(term)` Unifies this variable with `term` which must be a type of string or number or instance of Var, Function, Array or Object. If unify succeeds `binding` is an object with a key === newVar.name whose property is term. Otherwise a 'unification failed' error is thrown.

`val = newVar.rewrite()` returns the newVar binding if it exists otherwise `newVar.name`. If newVar is bound to an instance of Var then `newVar.binding.rewrite()` is returned. This is applied recursively until a bound variable is found. A side effect is that all traversed variables will have a binding property equal to `val`. If the chain of variable bindings is circular the `val` is `newVar.name`.

`val = newVar.toAnswerString()` returns `newVar.binding` if newVar is bound otherwise `newVar.name`.

## `Bindings`

The `Bindings` class defines the behavior for JSLogProg variable bindings.

### Constructor
`let bindings = new Bindings(binds)` where `bindings` is either an instance of `Bindings` or an object of variable bindings, e.g {X:'a', Y:2}.

### Properties
`currentBindings` an object of variable bindings, e.g {X:'a', Y:2}.

### Methods
`bindings.add(moreBindings)` Adds `moreBindings`, an object of variable bindings, e.g {X:'a', Y:2}, to this object's currentBindings property. Properties of duplicate keys in `moreBindings` overwrite those in currentBindings.

## `String`, `Number`, `Function`
`String`, `Number` and `Function` prototypes are extended with `unify`, `rewrite` and `toAnswerString` methods to integrate these types with JSLogProg.

`let binding = <instance of [String|Number|Function]>.unify(term)` Unifies with an unbound variable or with the same instance otherwise throws a 'unification failed' error.

`let val = <instance of [String|Number|Function]>.rewrite()` returns the string, number or function name, respectively.

`let val = <instance of [String|Number|Function]>.toAnswerSAtring()` returns the string, number or function name, respectively.

## `Array`
The `Array` prototype is extended with `unify`, `rewrite` and `toAnswerString` methods to integrate these types with JSLogProg.

`let binding = <instance of Array>.unify(term)` Unifies if `term` is an array of the same length and elements of `term` unify with elements of this array. Otherwise throws a 'unification failed' error.

`let val = [<instance of Array>.rewrite()` returns a new array where each element in this array is rewrittem.

`let val = <instance of Array>.toAnswerSAtring()` returns a string representation of this array and its elements, recursively.

## `Object`
The `Object` prototype is extended with `unify`, `rewrite` and `toAnswerString` methods to integrate these types with JSLogProg.

`let binding = <instance of Object>.unify(term)` Unifies if `term` is an object with the same keys, and properties of `term` unify with the properties of this object. Otherwise throws a 'unification failed' error.

`let val = [<instance of Object>.rewrite()` returns a new object where each property in this object is rewrittem.

`let val = <instance of Object>.toAnswerSAtring()` returns a string representation of this object and its properties, recursively.

