import {
	tap,
} from 'node:test/reporters';
import {
	run,
} from 'node:test';

import {
	glob,
} from 'fs/promises';

const __dirname = import.meta.dirname;

const ac = new AbortController();

let already_stopped = false;

const files: string[] = [];

for await(const filepath of glob(`${__dirname}/tests/**/*.spec.ts`)) {
	files.push(filepath);
}

run({
	files,
	concurrency: true,
	signal: ac.signal,
})
	.on('test:fail', (e) => {
		ac.abort();
		if (!already_stopped) {
			console.error(e);
		}
		already_stopped = true;
		process.exitCode = 1;
	})
	.compose(tap)
	.pipe(process.stdout);
