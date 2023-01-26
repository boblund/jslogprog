'use strict';

import {vars, clause, rule, solve} from './jslogprog.mjs';

function f(){};

let query = 
	//clause('father', 'X', 'Y'),
	//clause('grandfather', 'X', 'Y'),
	//clause('sibling', 'X', 'Y'),
	//[clause('isEqual', 'X', 2)], 
	clause('isEqual', ['X', ['Y','Z']], [2,[3,f]]),
	//clause('isEqual', ['X', ['Y',{z:'Z'}]], [2,[3,{z:f}]]),
	//[clause('isEqual', ['X', ['Y',{z:'Z'}]], [2,[3,{z:f}]])],
	//[clause('father', 'Z', 'X'), clause('father', 'Z', 'Y'), clause('notEqual', 'X', 'Y')],
	rules = [
		rule(clause('grandfather', 'X', 'Y'), clause('father', 'X', 'Z'), clause('father', 'Z', 'Y')),
		rule(clause('sibling', 'X', 'Y'), clause('father', 'Z', 'X'), clause('father', 'Z', 'Y'), clause('notEqual', 'X', 'Y')),
		rule(clause('father', 'homer', 'lisa')),
		rule(clause('father', 'homer', 'sam')),
		rule(clause('father', 'tom', 'homer')),
	];

console.log('query: ', query.toAnswerString());
for (const result of solve(query, rules)){
	let a = Object.keys(result).length === 0 ? 'true' : 'yes: ';
	console.log(Object.entries(result).reduce((a, e) => a += `${e[0]}=${e[1].toAnswerString()}, `, a).replace(/, $/,''));
}
console.log("no more solutions");

/*let [X, Y, Z] = vars('X', 'Y', 'Z');
try{
	let o = [1,{a:Y, b:15},3];
	//Y.unify(10);
	console.log(o.rewrite().toAnswerString());
	X.unify(Y);
	Y.unify(Z);
	Z.unify(X);
	//Z.unify(5);
	console.log(X.rewrite());
	console.log(X.toAnswerString());
} catch(e) {
	console.log(e === 'unification failed' ? e : e.message);
}*/