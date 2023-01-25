let [X, Y, Z] = vars('X', 'Y', 'Z'),
	query =  
		//clause('isEqual', [[X, [Y,f]], [2,[3,f]]]),
		//clause('sibling', [X, Y]),
		[clause('father', [Z, X]), clause('father', [Z, Y]), clause('notEqual', [X, Y])],
	rules = [
		rule(clause('sibling', [X, Y]), [clause('father', [Z, X]), clause('father', [Z, Y]), clause('notEqual', [X, Y])]),
		rule(clause('father', ['homer', 'lisa'])),
		rule(clause('father', ['homer', 'sam']))
	];

result.innerHTML = `query: ${query.toAnswerString()}\n`;
for (const solution of solve(query, rules)){
	result.innerHTML += `${(Object.entries(solution).reduce((a, [n, v]) => a += `${n}=${v}, `, '').replace(/, $/,''))}\n`;
}
result.innerHTML += 'no more solutions\n';