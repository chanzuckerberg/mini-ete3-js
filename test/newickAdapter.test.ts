require("../src/newickAdapter.ts")
const sum=jest.fn( x=>2+x);
test('2 times 2 is four', () => {
	expect(sum(2)).toBe(4);
	});