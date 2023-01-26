# JSLogProg

JSLogProg is an implementation of Prolog-like logic programming in Javascript (JS). It implements Var, Clause, Rule and Query objects for the equivalent Prolog items and implements Prolog unification and goal resolution. JSProlog introduces the following enhancements:
- Any JavaScript type (number, string, function, array and object) can be a Prolog symbol in a clause.
- In a clause definition, a JS string starting with an uppercase or underscore is interpreted as a Prolog Variable reference and replaced with a Var object.
- JS Arrays and Objects are first-class Prolog terms and a Prolog variable can appear as an Array element or Object property.
- A Prolog clause definition can be implemented with a JS function. For example, the builtin Prolog '=' operator is implemented by the JS function isEqual(a, b) where 'a' and 'b' can be a JS number, string, function, array, object or Prolog Variable.

The following table summarizes the mapping of Prolog elements to JSProlog:

<table>
	<tr>
		<th></th>
		<th>Prolog</th>
		<th>JSLogProg</th>
	</tr>
	<tr>
		<td>constant</td>
		<td>atom, number</td>
		<td>JavaScript string, number, function, array, object</td>
	</tr>
	<tr>
		<td>variable</td>
		<td>variable</td>
		<td>variable</td>
	</tr>
	<tr>
		<td>fact</td>
		<td>fact</td>
		<td>fact</td>
	</tr>
	<tr>
		<td>rule</td>
		<td>rule</td>
		<td>rule</td>
	</tr>
	<tr>
		<td>query</td>
		<td>query</td>
		<td>query</td>
	</tr>
</table>

# Use
```
import {vars, clause, rule, solve, Var, assert, Bindings} from './jslogprog.mjs';

function notEqual([arg1, arg2]) {
	assert((arg1 instanceof Var ? arg1.binding : arg1.toString()) != (arg2 instanceof Var ? arg2.binding : arg2.toString()));
	return new Bindings({'X': arg1, 'Y': arg2});
}

clause('sibling', 'X', 'Y');
const rules = [
	rule(clause(notEqual, 'X', 'Y')),
	rule(clause('sibling', 'X', 'Y'), clause('father', 'Z', 'X'), clause('father', 'Z', 'Y'), clause('notEqual', 'X', 'Y')),
	rule(clause('father', 'homer', 'lisa')),
	rule(clause('father', 'homer', 'sam'))
];

console.log('query: ', query.toAnswerString());
for (const result of solve(query, rules)){
	let a = Object.keys(result).length === 0 ? 'true' : 'yes: ';
	console.log(Object.entries(result).reduce((a, e) => a += `${e[0]}=${e[1].toAnswerString()}, `, a).replace(/, $/,''));
}
console.log("no more solutions");
// query:  sibling(X, Y)
// X=sam, Y=lisa
// X=lisa, Y=sam
// no more solutions
```
`result` is an object where the keys are Variable names and properties are the solution bindings.

**NOTE** `jslogprog.mjs` defines the notEqual clause. It's inclusion in this example is for illustration.

JSLogProg can be used without rules, clauses and queries. For example:

```
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