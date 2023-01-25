'use strict';

import {vars, clause, rule, solve} from './jslogprog.mjs';

function f(){};

let [x, y, z] = vars('X', 'Y', 'Z'),
	query =  
		//clause('isEqual', [[x, [y,f]], [2,[3,f]]]),
		clause('sibling', [x, y]),
	rules = [
		rule(clause('test', [x]), [clause('isEqual', [y, 'sam']), clause('sibling', [x, y])]),
		rule(clause('sibling', [x, y]), [clause('father', [z, x]), clause('father', [z, y]), clause('notEqual', [x, y])]),
		rule(clause('father', ['homer', 'lisa'])),
		rule(clause('father', ['homer', 'sam']))
	];

console.log('query: ', query.toAnswerString());
for (const result of solve(query, rules)){
	console.log(Object.entries(result).reduce((a, [n, v]) => a += `${n}=${v}, `, '').replace(/, $/,''));
}
console.log("no more solutions");

[x, y] = vars('x', 'y');
let env = {};
y.unify('bob', env);
let o = [1,{a:y},3];
x.unify(o, {});
console.log(`x = ${x.toAnswerString()}`);
